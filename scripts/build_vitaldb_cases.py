#!/usr/bin/env python3
"""Build a compact, de-identified teaching bundle from VitalDB's public API.

The generated questions describe signal trends only. They are deliberately not
diagnostic or prescriptive and remain marked for specialist review in the UI.
"""

from __future__ import annotations

import csv
import gzip
import io
import json
import math
import statistics
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any

API_ROOT = "https://api.vitaldb.net"
OUTPUT = Path(__file__).resolve().parents[1] / "public" / "cases" / "cases.json"
SAMPLE_SECONDS = 10
CASE_IDS = [1, 3, 5, 7, 10]

TRACKS = {
    "hr": ("Solar8000/HR",),
    "map": ("Solar8000/ART_MBP", "Solar8000/NIBP_MBP"),
    "spo2": ("Solar8000/PLETH_SPO2",),
    "etco2": ("Solar8000/ETCO2", "Primus/ETCO2"),
    "bis": ("BIS/BIS",),
}

RANGES = {
    "hr": (20.0, 220.0),
    "map": (20.0, 180.0),
    "spo2": (50.0, 100.0),
    "etco2": (5.0, 80.0),
    # VitalDB exports unavailable BIS segments as zero in some tracks. A true
    # value of zero cannot be distinguished from that sentinel here, so omit it.
    "bis": (1.0, 100.0),
}

LABELS = {
    "hr": "心率",
    "map": "平均动脉压",
    "spo2": "血氧饱和度",
    "etco2": "呼气末二氧化碳",
    "bis": "BIS",
}

UNITS = {"hr": "bpm", "map": "mmHg", "spo2": "%", "etco2": "mmHg", "bis": ""}

FOCUS = {
    1: "长时程腹部手术中的多参数趋势",
    3: "短时程腔镜手术的阶段变化",
    5: "复杂血管手术的长时程观察",
    7: "胸科手术中的呼吸与循环趋势",
    10: "胃肠手术中的连续监护变化",
}


@dataclass
class TrackInfo:
    caseid: int
    name: str
    tid: str


def fetch_text(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": "AneTrace/0.1 educational build"})
    with urllib.request.urlopen(request, timeout=90) as response:
        payload = response.read()
        if payload[:2] == b"\x1f\x8b":
            payload = gzip.decompress(payload)
        return payload.decode("utf-8-sig")


def fetch_csv(url: str) -> list[dict[str, str]]:
    return list(csv.DictReader(io.StringIO(fetch_text(url))))


def load_catalog() -> tuple[dict[int, dict[str, str]], dict[int, list[TrackInfo]]]:
    cases = {int(row["caseid"]): row for row in fetch_csv(f"{API_ROOT}/cases")}
    tracks: dict[int, list[TrackInfo]] = {}
    for row in fetch_csv(f"{API_ROOT}/trks"):
        caseid = int(row["caseid"])
        if caseid in CASE_IDS:
            tracks.setdefault(caseid, []).append(
                TrackInfo(caseid=caseid, name=row["tname"], tid=row["tid"]),
            )
    return cases, tracks


def select_track(available: list[TrackInfo], candidates: tuple[str, ...]) -> TrackInfo | None:
    by_name = {track.name: track for track in available}
    return next((by_name[name] for name in candidates if name in by_name), None)


def load_numeric_track(track: TrackInfo, key: str) -> list[tuple[float, float]]:
    rows = fetch_csv(f"{API_ROOT}/{track.tid}")
    low, high = RANGES[key]
    values: list[tuple[float, float]] = []
    for row in rows:
        try:
            time = float(row["Time"])
            value_key = next(column for column in row if column != "Time")
            value = float(row[value_key])
        except (ValueError, StopIteration, TypeError):
            continue
        if math.isfinite(time) and math.isfinite(value) and low <= value <= high:
            values.append((time, value))
    return values


def resample(values: list[tuple[float, float]], duration: int) -> list[list[float | int]]:
    if not values:
        return []
    result: list[list[float | int]] = []
    index = 0
    last: tuple[float, float] | None = None
    for target in range(0, duration + 1, SAMPLE_SECONDS):
        while index < len(values) and values[index][0] <= target:
            last = values[index]
            index += 1
        if last is not None and target - last[0] <= 90:
            result.append([target, round(last[1], 1)])
    return result


def nearest_value(points: list[list[float | int]], time: int) -> float | None:
    candidates = [point for point in points if abs(int(point[0]) - time) <= SAMPLE_SECONDS * 2]
    if not candidates:
        return None
    return float(min(candidates, key=lambda point: abs(int(point[0]) - time))[1])


def rolling_median(points: list[list[float | int]], time: int) -> float | None:
    window = [float(value) for stamp, value in points if time - 300 <= int(stamp) <= time - 60]
    return statistics.median(window) if len(window) >= 6 else None


def build_checkpoints(series: dict[str, list[list[float | int]]], duration: int) -> list[dict[str, Any]]:
    scales = {"hr": 15, "map": 12, "spo2": 3, "etco2": 6, "bis": 12}
    candidates: list[tuple[float, int, str, float, float]] = []
    start = max(600, int(duration * 0.12))
    end = int(duration * 0.9)
    for time in range(start, end, 30):
        for key, points in series.items():
            current_window = [
                nearest_value(points, offset)
                for offset in range(max(0, time - 30), min(duration, time + 31), 10)
            ]
            current_values = [value for value in current_window if value is not None]
            baseline = rolling_median(points, time)
            if len(current_values) < 4 or baseline is None:
                continue
            current = statistics.median(current_values)
            score = abs(current - baseline) / scales[key]
            if score >= 0.85:
                candidates.append((score, time, key, current, baseline))

    chosen: list[tuple[float, int, str, float, float]] = []
    for candidate in sorted(candidates, reverse=True):
        if candidate[2] in {item[2] for item in chosen}:
            continue
        if all(abs(candidate[1] - item[1]) >= max(360, duration * 0.12) for item in chosen):
            chosen.append(candidate)
        if len(chosen) == 3:
            break
    chosen.sort(key=lambda item: item[1])

    keys = list(TRACKS)
    checkpoints = []
    for index, (_, time, answer, current, baseline) in enumerate(chosen, start=1):
        direction = "升高" if current > baseline else "降低"
        checkpoints.append(
            {
                "id": f"q-{index}",
                "time": time,
                "prompt": "与此前约五分钟的稳定水平相比，哪项监护参数的变化最突出？",
                "options": [{"id": key, "label": LABELS[key]} for key in keys],
                "answer": answer,
                "explanation": (
                    f"此时间窗内{LABELS[answer]}中位值约为 {current:.0f} {UNITS[answer]}，"
                    f"此前基线约为 {baseline:.0f} {UNITS[answer]}，呈明显{direction}趋势。"
                    "这里只描述数据变化，不代表诊断或处置建议。"
                ),
                "reviewStatus": "needs-expert-review",
            }
        )
    return checkpoints


def age_band(raw_age: str) -> str:
    age = int(float(raw_age))
    lower = age // 10 * 10
    return f"{lower}–{lower + 9} 岁"


def build_case(meta: dict[str, str], available: list[TrackInfo]) -> dict[str, Any]:
    caseid = int(meta["caseid"])
    duration = int(float(meta["caseend"]))
    series: dict[str, list[list[float | int]]] = {}
    sources: dict[str, str] = {}
    for key, candidates in TRACKS.items():
        remaining = list(candidates)
        while remaining:
            track = select_track(available, tuple(remaining))
            if track is None:
                break
            compact = resample(load_numeric_track(track, key), duration)
            if compact:
                series[key] = compact
                sources[key] = track.name
                break
            remaining.remove(track.name)

    events = []
    for key, label in (("opstart", "手术开始"), ("opend", "手术结束")):
        try:
            time = int(float(meta[key]))
        except (ValueError, TypeError):
            continue
        if 0 <= time <= duration:
            events.append({"id": key, "time": time, "label": label, "kind": "phase"})

    return {
        "id": f"vitaldb-{caseid}",
        "sourceCaseId": caseid,
        "title": meta.get("opname") or f"VitalDB 病例 {caseid}",
        "subtitle": FOCUS[caseid],
        "duration": duration,
        "patient": {
            "ageBand": age_band(meta["age"]),
            "sex": "男性" if meta.get("sex") == "M" else "女性",
            "asa": f"ASA {meta.get('asa') or '—'}",
        },
        "procedure": {
            "department": meta.get("department") or "未提供",
            "type": meta.get("optype") or "未提供",
            "approach": meta.get("approach") or "未提供",
            "anesthesia": meta.get("ane_type") or "未提供",
        },
        "tracks": series,
        "trackSources": sources,
        "events": sorted(events, key=lambda event: event["time"]),
        "checkpoints": build_checkpoints(series, duration),
        "provenance": {
            "dataset": "VitalDB v1.0.0",
            "license": "CC BY 4.0",
            "url": "https://physionet.org/content/vitaldb/1.0.0/",
            "samplingSeconds": SAMPLE_SECONDS,
        },
    }


def main() -> None:
    cases, tracks = load_catalog()
    bundle = {
        "schemaVersion": 1,
        "generatedAt": "2026-08-29",
        "disclaimer": "仅用于医学教育与软件演示，不用于临床诊断、监测或治疗决策。",
        "cases": [build_case(cases[caseid], tracks[caseid]) for caseid in CASE_IDS],
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(bundle, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {len(bundle['cases'])} cases to {OUTPUT}")
    for case in bundle["cases"]:
        print(
            f"  {case['id']}: {len(case['tracks'])} tracks, "
            f"{len(case['checkpoints'])} checkpoints, {case['duration']} sec",
        )


if __name__ == "__main__":
    main()
