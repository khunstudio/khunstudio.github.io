#!/usr/bin/env python3
"""RE:LEV 디바이스 → 쿠팡 파트너스 딥링크 일괄 생성

각 디바이스의 쿠팡 검색 URL(사이트의 '쿠팡에서 검색' 버튼과 같은 주소)을
쿠팡 파트너스 딥링크 API로 제휴 링크로 바꿔 data/affiliate.json 에 저장합니다.
사이트는 이 파일에 링크가 있는 디바이스만 '쿠팡에서 보기 · 제휴' 버튼과 고지 문구를 보여 줍니다.

사용법 (키는 쿠팡 파트너스 > 추가 기능 > 오픈 API 에서 발급)
  export COUPANG_ACCESS_KEY=...
  export COUPANG_SECRET_KEY=...
  python3 relev/tools/coupang_deeplinks.py            # 링크 없는 디바이스만 생성
  python3 relev/tools/coupang_deeplinks.py --refresh  # 전부 다시 생성
  python3 relev/tools/coupang_deeplinks.py --dry-run  # API 호출 없이 대상만 확인

키는 파일이나 저장소에 저장하지 마세요. 환경 변수로만 넘깁니다.
"""
import argparse
import hashlib
import hmac
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEVICES = os.path.join(ROOT, "data", "devices.json")
OUT = os.path.join(ROOT, "data", "affiliate.json")
HOST = "https://api-gateway.coupang.com"
PATH = "/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink"
BATCH = 20  # 한 번에 보낼 URL 수 (보수적으로)


def search_url(d):
    # app.js 의 coupangSearchUrl 과 같은 규칙 (encodeURIComponent 와 같은 안전 문자)
    q = d.get("fullName") or ((d.get("brand") + " " if d.get("brand") else "") + d["name"])
    return "https://www.coupang.com/np/search?q=" + urllib.parse.quote(q, safe="-_.!~*'()")


def auth_header(access, secret, method, path, query=""):
    signed = time.strftime("%y%m%d", time.gmtime()) + "T" + time.strftime("%H%M%S", time.gmtime()) + "Z"
    msg = signed + method + path + query
    sig = hmac.new(secret.encode(), msg.encode(), hashlib.sha256).hexdigest()
    return "CEA algorithm=HmacSHA256, access-key={}, signed-date={}, signature={}".format(access, signed, sig)


def deeplink(urls, access, secret, sub_id=None):
    body = {"coupangUrls": urls}
    if sub_id:
        body["subId"] = sub_id
    req = urllib.request.Request(HOST + PATH, data=json.dumps(body).encode(), method="POST")
    req.add_header("Content-Type", "application/json;charset=UTF-8")
    req.add_header("Authorization", auth_header(access, secret, "POST", PATH))
    with urllib.request.urlopen(req, timeout=30) as r:
        res = json.loads(r.read().decode())
    if str(res.get("rCode")) != "0":
        raise RuntimeError("API 오류: {} {}".format(res.get("rCode"), res.get("rMessage")))
    return res.get("data") or []


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--refresh", action="store_true", help="이미 있는 링크도 다시 생성")
    ap.add_argument("--dry-run", action="store_true", help="API 호출 없이 대상만 출력")
    ap.add_argument("--sub-id", default=None, help="쿠팡 파트너스 채널 ID(subId), 선택")
    ap.add_argument("--limit", type=int, default=0, help="앞에서부터 N개만 (시험용)")
    a = ap.parse_args()

    devices = json.load(open(DEVICES, encoding="utf-8"))
    out = json.load(open(OUT, encoding="utf-8")) if os.path.exists(OUT) else {}
    links = out.get("links") or {}
    todo = [d for d in devices if a.refresh or d["id"] not in links]
    if a.limit:
        todo = todo[: a.limit]
    print("디바이스 {}개 중 생성 대상 {}개".format(len(devices), len(todo)))
    if a.dry_run:
        for d in todo[:10]:
            print(" ", d["id"], search_url(d))
        return

    access, secret = os.environ.get("COUPANG_ACCESS_KEY"), os.environ.get("COUPANG_SECRET_KEY")
    if not access or not secret:
        sys.exit("COUPANG_ACCESS_KEY / COUPANG_SECRET_KEY 환경 변수가 필요합니다.")

    done = 0
    for i in range(0, len(todo), BATCH):
        chunk = todo[i:i + BATCH]
        urls = [search_url(d) for d in chunk]
        try:
            data = deeplink(urls, access, secret, a.sub_id)
        except Exception as e:  # 한 묶음이 실패해도 지금까지 결과는 저장
            print("  묶음 {} 실패: {}".format(i // BATCH + 1, e))
            time.sleep(3)
            continue
        by_url = {x.get("originalUrl"): x.get("shortenUrl") for x in data}
        for d, u in zip(chunk, urls):
            short = by_url.get(u)
            if short:
                links[d["id"]] = short
                done += 1
        print("  {}/{} 완료".format(min(i + BATCH, len(todo)), len(todo)))
        time.sleep(1.2)  # 호출 한도 여유

    out = {"provider": "coupang-partners", "updatedAt": date.today().isoformat(), "links": links}
    json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("저장: {} (이번에 {}개 생성, 총 {}개)".format(os.path.relpath(OUT), done, len(links)))


if __name__ == "__main__":
    main()
