from __future__ import annotations
"""Normalize the 111 年事故 CSV so it matches the 113 年欄位並輸出 TSV.

The source CSV（Big5 編碼）以每位當事者為一列。這個腳本會：
1. 以時間、地點與座標分組，合併成每起事故一列。
2. 取當事人序號為 1 的列填入各欄位值，並計算當事人數。
3. 將「光線」對應到 113 年使用的「道路照明設備」欄位，
   將「安全帽」對應到「保護裝置」。

執行後會覆寫根目錄的 accidentXY_111.tsv，欄位順序與
accidentXY_113.tsv 保持一致。
"""

import csv
from collections import OrderedDict
from pathlib import Path
from typing import Dict, Iterable, Tuple

FIELDNAMES = [
    "年",
    "月",
    "日",
    "時",
    "分",
    "縣市",
    "行政區",
    "allLocation",
    "GoogleLat",
    "GoogleLng",
    "死",
    "2-30",
    "受傷",
    "當事人數",
    "天候",
    "道路照明設備",
    "道路類別",
    "道路型態",
    "事故位置",
    "路面狀況1",
    "路面狀況2",
    "路面狀況3",
    "道路障礙1",
    "道路障礙2",
    "號誌1",
    "號誌2",
    "車道劃分-分向",
    "車道劃分-分道1",
    "車道劃分-分道2",
    "車道劃分-分道3",
    "事故類型及型態",
    "行動電話",
    "當事者行動狀態",
    "駕駛資格情形",
    "保護裝置",
    "飲酒情形",
    "駕駛執照種類",
    "個人肇逃否",
    "肇因碼-主要",
    "性別",
    "受傷程度",
    "車輛撞擊部位1",
    "車輛撞擊部位2",
]


def _district_from_location(location: str) -> str:
    if not location:
        return ""
    idx = location.find("區")
    return location[: idx + 1] if idx != -1 else ""


def _pick(row: Dict[str, str], *names: str) -> str:
    for name in names:
        if name in row:
            return row[name]
    return ""


def _group_rows(rows: Iterable[Dict[str, str]]):
    groups: "OrderedDict[Tuple[str, ...], Dict[str, object]]" = OrderedDict()
    for row in rows:
        key = (
            row.get("發生年度", ""),
            row.get("發生月", ""),
            row.get("發生日", ""),
            row.get("發生時-Hours", ""),
            row.get("發生分", ""),
            row.get("肇事地點", ""),
            row.get("座標-X", ""),
            row.get("座標-Y", ""),
        )
        data = groups.setdefault(key, {"count": 0, "first": None})
        data["count"] = int(data["count"]) + 1
        if row.get("當事人序號") == "1" or data["first"] is None:
            data["first"] = row
    return groups


def convert_csv_to_tsv(csv_path: Path, tsv_path: Path, city: str = "臺北市") -> None:
    with csv_path.open(encoding="big5", newline="") as source:
        reader = csv.DictReader(source)
        grouped = _group_rows(reader)

    with tsv_path.open("w", encoding="utf-8", newline="") as target:
        writer = csv.DictWriter(target, FIELDNAMES, delimiter="\t")
        writer.writeheader()

        for (year, month, day, hour, minute, location, lng, lat), data in grouped.items():
            row = data["first"] or {}
            district = _district_from_location(location)

            writer.writerow(
                {
                    "年": year,
                    "月": month,
                    "日": day,
                    "時": hour,
                    "分": minute,
                    "縣市": city,
                    "行政區": district,
                    "allLocation": location,
                    "GoogleLat": lat,
                    "GoogleLng": lng,
                    "死": row.get("死亡人數", ""),
                    "2-30": row.get("2-30日死亡人數", ""),
                    "受傷": row.get("受傷人數", ""),
                    "當事人數": data["count"],
                    "天候": row.get("天候", ""),
                    "道路照明設備": _pick(row, "道路照明設備", "光線"),
                    "道路類別": row.get("道路類別", ""),
                    "道路型態": row.get("道路型態", ""),
                    "事故位置": row.get("事故位置", ""),
                    "路面狀況1": row.get("路面狀況1", ""),
                    "路面狀況2": row.get("路面狀況2", ""),
                    "路面狀況3": row.get("路面狀況3", ""),
                    "道路障礙1": row.get("道路障礙1", ""),
                    "道路障礙2": row.get("道路障礙2", ""),
                    "號誌1": row.get("號誌1", ""),
                    "號誌2": row.get("號誌2", ""),
                    "車道劃分-分向": row.get("車道劃分-分向", ""),
                    "車道劃分-分道1": row.get("車道劃分-分道1", ""),
                    "車道劃分-分道2": row.get("車道劃分-分道2", ""),
                    "車道劃分-分道3": row.get("車道劃分-分道3", ""),
                    "事故類型及型態": row.get("事故類型及型態", ""),
                    "行動電話": row.get("行動電話", ""),
                    "當事者行動狀態": row.get("當事者行動狀態", ""),
                    "駕駛資格情形": row.get("駕駛資格情形", ""),
                    "保護裝置": _pick(row, "保護裝置", "安全帽"),
                    "飲酒情形": row.get("飲酒情形", ""),
                    "駕駛執照種類": row.get("駕駛執照種類", ""),
                    "個人肇逃否": row.get("個人肇逃否", ""),
                    "肇因碼-主要": row.get("肇因碼-主要", ""),
                    "性別": row.get("性別", ""),
                    "受傷程度": row.get("受傷程度", ""),
                    "車輛撞擊部位1": row.get("車輛撞擊部位1", ""),
                    "車輛撞擊部位2": row.get("車輛撞擊部位2", ""),
                }
            )


def main():
    convert_csv_to_tsv(
        Path("111年-臺北市A1及A2類交通事故明細.csv"), Path("accidentXY_111.tsv")
    )


if __name__ == "__main__":
    main()
