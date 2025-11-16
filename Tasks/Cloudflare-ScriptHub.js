const _scriptSonverterCompatibilityType =
  typeof $response !== "undefined"
    ? "response"
    : typeof $request !== "undefined"
    ? "request"
    : "";
const _scriptSonverterCompatibilityDone = $done;
try {
  // 转换时间: 2025/11/16 15:37:31
  // 兼容性转换
  if (typeof $request !== "undefined") {
    const lowerCaseRequestHeaders = Object.fromEntries(
      Object.entries($request.headers).map(([k, v]) => [k.toLowerCase(), v])
    );

    $request.headers = new Proxy(lowerCaseRequestHeaders, {
      get: function (target, propKey, receiver) {
        return Reflect.get(target, propKey.toLowerCase(), receiver);
      },
      set: function (target, propKey, value, receiver) {
        return Reflect.set(target, propKey.toLowerCase(), value, receiver);
      },
    });
  }
  if (typeof $response !== "undefined") {
    const lowerCaseResponseHeaders = Object.fromEntries(
      Object.entries($response.headers).map(([k, v]) => [k.toLowerCase(), v])
    );

    $response.headers = new Proxy(lowerCaseResponseHeaders, {
      get: function (target, propKey, receiver) {
        return Reflect.get(target, propKey.toLowerCase(), receiver);
      },
      set: function (target, propKey, value, receiver) {
        return Reflect.set(target, propKey.toLowerCase(), value, receiver);
      },
    });
  }
  Object.getOwnPropertyNames($httpClient).forEach((method) => {
    if (typeof $httpClient[method] === "function") {
      $httpClient[method] = new Proxy($httpClient[method], {
        apply: (target, ctx, args) => {
          for (let field in args?.[0]?.headers) {
            if (["host"].includes(field.toLowerCase())) {
              delete args[0].headers[field];
            } else if (["number"].includes(typeof args[0].headers[field])) {
              args[0].headers[field] = args[0].headers[field].toString();
            }
          }
          return Reflect.apply(target, ctx, args);
        },
      });
    }
  });

  // QX 相关
  var setInterval = () => {};
  var clearInterval = () => {};
  var $task = {
    fetch: (url) => {
      return new Promise((resolve, reject) => {
        if (url.method == "POST") {
          $httpClient.post(url, (error, response, data) => {
            if (response) {
              response.body = data;
              resolve(response, {
                error: error,
              });
            } else {
              resolve(null, {
                error: error,
              });
            }
          });
        } else {
          $httpClient.get(url, (error, response, data) => {
            if (response) {
              response.body = data;
              resolve(response, {
                error: error,
              });
            } else {
              resolve(null, {
                error: error,
              });
            }
          });
        }
      });
    },
  };

  var $prefs = {
    removeValueForKey: (key) => {
      let result;
      try {
        result = $persistentStore.write("", key);
      } catch (e) {}
      if ($persistentStore.read(key) == null) return result;
      try {
        result = $persistentStore.write(null, key);
      } catch (e) {}
      if ($persistentStore.read(key) == null) return result;
      const err = "无法模拟 removeValueForKey 删除 key: " + key;
      console.log(err);
      $notification.post("Script Hub: 脚本转换", "❌ local.js", err);
      return result;
    },
    valueForKey: (key) => {
      return $persistentStore.read(key);
    },
    setValueForKey: (val, key) => {
      return $persistentStore.write(val, key);
    },
  };

  var $notify = (title = "", subt = "", desc = "", opts) => {
    const toEnvOpts = (rawopts) => {
      if (!rawopts) return rawopts;
      if (typeof rawopts === "string") {
        if ("undefined" !== typeof $loon) return rawopts;
        else if ("undefined" !== typeof $rocket) return rawopts;
        else return { url: rawopts };
      } else if (typeof rawopts === "object") {
        if ("undefined" !== typeof $loon) {
          let openUrl = rawopts.openUrl || rawopts.url || rawopts["open-url"];
          let mediaUrl = rawopts.mediaUrl || rawopts["media-url"];
          return { openUrl, mediaUrl };
        } else {
          let openUrl = rawopts.url || rawopts.openUrl || rawopts["open-url"];
          if ("undefined" !== typeof $rocket) return openUrl;
          return { url: openUrl };
        }
      } else {
        return undefined;
      }
    };
    console.log(title, subt, desc, toEnvOpts(opts));
    $notification.post(title, subt, desc, toEnvOpts(opts));
  };
  var _scriptSonverterOriginalDone = $done;
  var _scriptSonverterDone = (val = {}) => {
    let result;
    if (
      (typeof $request !== "undefined" &&
        typeof val === "object" &&
        typeof val.status !== "undefined" &&
        typeof val.headers !== "undefined" &&
        typeof val.body !== "undefined") ||
      false
    ) {
      try {
        for (const part of val?.status?.split(" ")) {
          const statusCode = parseInt(part, 10);
          if (!isNaN(statusCode)) {
            val.status = statusCode;
            break;
          }
        }
      } catch (e) {}
      if (!val.status) {
        val.status = 200;
      }
      if (!val.headers) {
        val.headers = {
          "Content-Type": "text/plain; charset=UTF-8",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST,GET,OPTIONS,PUT,DELETE",
          "Access-Control-Allow-Headers":
            "Origin, X-Requested-With, Content-Type, Accept",
        };
      }
      result = { response: val };
    } else {
      result = val;
    }
    console.log("$done");
    try {
      console.log(JSON.stringify(result));
    } catch (e) {
      console.log(result);
    }
    _scriptSonverterOriginalDone(result);
  };
  var window = globalThis;
  window.$done = _scriptSonverterDone;
  var global = globalThis;
  global.$done = _scriptSonverterDone;

  function md5cycle(x, k) {
    let a = x[0],
      b = x[1],
      c = x[2],
      d = x[3];
    function cmn(q, a, b, x, s, t) {
      a = (a + q + x + t) | 0;
      return (((a << s) | (a >>> (32 - s))) + b) | 0;
    }
    function ff(a, b, c, d, x, s, t) {
      return cmn((b & c) | (~b & d), a, b, x, s, t);
    }
    function gg(a, b, c, d, x, s, t) {
      return cmn((b & d) | (c & ~d), a, b, x, s, t);
    }
    function hh(a, b, c, d, x, s, t) {
      return cmn(b ^ c ^ d, a, b, x, s, t);
    }
    function ii(a, b, c, d, x, s, t) {
      return cmn(c ^ (b | ~d), a, b, x, s, t);
    }

    a = ff(a, b, c, d, k[0], 7, -680876936);
    d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819);
    b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897);
    d = ff(d, a, b, c, k[5], 12, 1200080426);
    c = ff(c, d, a, b, k[6], 17, -1473231341);
    b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416);
    d = ff(d, a, b, c, k[9], 12, -1958414417);
    c = ff(c, d, a, b, k[10], 17, -42063);
    b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682);
    d = ff(d, a, b, c, k[13], 12, -40341101);
    c = ff(c, d, a, b, k[14], 17, -1502002290);
    b = ff(b, c, d, a, k[15], 22, 1236535329);

    a = gg(a, b, c, d, k[1], 5, -165796510);
    d = gg(d, a, b, c, k[6], 9, -1069501632);
    c = gg(c, d, a, b, k[11], 14, 643717713);
    b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691);
    d = gg(d, a, b, c, k[10], 9, 38016083);
    c = gg(c, d, a, b, k[15], 14, -660478335);
    b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438);
    d = gg(d, a, b, c, k[14], 9, -1019803690);
    c = gg(c, d, a, b, k[3], 14, -187363961);
    b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467);
    d = gg(d, a, b, c, k[2], 9, -51403784);
    c = gg(c, d, a, b, k[7], 14, 1735328473);
    b = gg(b, c, d, a, k[12], 20, -1926607734);

    a = hh(a, b, c, d, k[5], 4, -378558);
    d = hh(d, a, b, c, k[8], 11, -2022574463);
    c = hh(c, d, a, b, k[11], 16, 1839030562);
    b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060);
    d = hh(d, a, b, c, k[4], 11, 1272893353);
    c = hh(c, d, a, b, k[7], 16, -155497632);
    b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174);
    d = hh(d, a, b, c, k[0], 11, -358537222);
    c = hh(c, d, a, b, k[3], 16, -722521979);
    b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487);
    d = hh(d, a, b, c, k[12], 11, -421815835);
    c = hh(c, d, a, b, k[15], 16, 530742520);
    b = hh(b, c, d, a, k[2], 23, -995338651);

    a = ii(a, b, c, d, k[0], 6, -198630844);
    d = ii(d, a, b, c, k[7], 10, 1126891415);
    c = ii(c, d, a, b, k[14], 15, -1416354905);
    b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571);
    d = ii(d, a, b, c, k[3], 10, -1894986606);
    c = ii(c, d, a, b, k[10], 15, -1051523);
    b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359);
    d = ii(d, a, b, c, k[15], 10, -30611744);
    c = ii(c, d, a, b, k[6], 15, -1560198380);
    b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070);
    d = ii(d, a, b, c, k[11], 10, -1120210379);
    c = ii(c, d, a, b, k[2], 15, 718787259);
    b = ii(b, c, d, a, k[9], 21, -343485551);

    x[0] = (a + x[0]) | 0;
    x[1] = (b + x[1]) | 0;
    x[2] = (c + x[2]) | 0;
    x[3] = (d + x[3]) | 0;
  }
  function md5blk(s) {
    const md5blks = [];
    for (let i = 0; i < 64; i += 4) {
      md5blks[i >> 2] =
        s.charCodeAt(i) +
        (s.charCodeAt(i + 1) << 8) +
        (s.charCodeAt(i + 2) << 16) +
        (s.charCodeAt(i + 3) << 24);
    }
    return md5blks;
  }
  function md51(s) {
    const n = s.length;
    const state = [1732584193, -271733879, -1732584194, 271733878];
    let i;
    for (i = 64; i <= n; i += 64) {
      md5cycle(state, md5blk(s.substring(i - 64, i)));
    }
    s = s.substring(i - 64);
    const tail = new Array(16).fill(0);
    for (i = 0; i < s.length; i++)
      tail[i >> 2] |= s.charCodeAt(i) << (i % 4 << 3);
    tail[i >> 2] |= 0x80 << (i % 4 << 3);
    if (i > 55) {
      md5cycle(state, tail);
      for (i = 0; i < 16; i++) tail[i] = 0;
    }
    tail[14] = n * 8;
    md5cycle(state, tail);
    return state;
  }
  function rhex(n) {
    const s = "0123456789abcdef";
    let j,
      str = "";
    for (j = 0; j < 4; j++) {
      str +=
        s.charAt((n >> (j * 8 + 4)) & 0x0f) + s.charAt((n >> (j * 8)) & 0x0f);
    }
    return str;
  }
  function hex(x) {
    return x.map(rhex).join("");
  }
  function md5(s) {
    return hex(md51(s));
  }

  var _0xodx = "jsjiami.com.v7";
  const _0x4c8f41 = _0x1592;
  function _0x1592(_0x3201bd, _0x9993ff) {
    const _0x2fa6cb = _0x2fa6();
    return (
      (_0x1592 = function (_0x1592bf, _0xc0c0d0) {
        _0x1592bf = _0x1592bf - 0x8a;
        let _0x1da2db = _0x2fa6cb[_0x1592bf];
        if (_0x1592["BAVAFZ"] === undefined) {
          var _0x1c56df = function (_0x1feaca) {
            const _0x4e06fc =
              "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=";
            let _0x340dc7 = "",
              _0x37f89c = "";
            for (
              let _0x5ca5e0 = 0x0, _0xc92d3b, _0x186694, _0x1e901f = 0x0;
              (_0x186694 = _0x1feaca["charAt"](_0x1e901f++));
              ~_0x186694 &&
              ((_0xc92d3b =
                _0x5ca5e0 % 0x4 ? _0xc92d3b * 0x40 + _0x186694 : _0x186694),
              _0x5ca5e0++ % 0x4)
                ? (_0x340dc7 += String["fromCharCode"](
                    0xff & (_0xc92d3b >> ((-0x2 * _0x5ca5e0) & 0x6))
                  ))
                : 0x0
            ) {
              _0x186694 = _0x4e06fc["indexOf"](_0x186694);
            }
            for (
              let _0x5ccbe2 = 0x0, _0x5df31c = _0x340dc7["length"];
              _0x5ccbe2 < _0x5df31c;
              _0x5ccbe2++
            ) {
              _0x37f89c +=
                "%" +
                ("00" + _0x340dc7["charCodeAt"](_0x5ccbe2)["toString"](0x10))[
                  "slice"
                ](-0x2);
            }
            return decodeURIComponent(_0x37f89c);
          };
          const _0x5263b4 = function (_0x20fbd4, _0x19459a) {
            let _0x384299 = [],
              _0x1be603 = 0x0,
              _0x164975,
              _0xca8d25 = "";
            _0x20fbd4 = _0x1c56df(_0x20fbd4);
            let _0x48a81f;
            for (_0x48a81f = 0x0; _0x48a81f < 0x100; _0x48a81f++) {
              _0x384299[_0x48a81f] = _0x48a81f;
            }
            for (_0x48a81f = 0x0; _0x48a81f < 0x100; _0x48a81f++) {
              (_0x1be603 =
                (_0x1be603 +
                  _0x384299[_0x48a81f] +
                  _0x19459a["charCodeAt"](_0x48a81f % _0x19459a["length"])) %
                0x100),
                (_0x164975 = _0x384299[_0x48a81f]),
                (_0x384299[_0x48a81f] = _0x384299[_0x1be603]),
                (_0x384299[_0x1be603] = _0x164975);
            }
            (_0x48a81f = 0x0), (_0x1be603 = 0x0);
            for (
              let _0x41cb4e = 0x0;
              _0x41cb4e < _0x20fbd4["length"];
              _0x41cb4e++
            ) {
              (_0x48a81f = (_0x48a81f + 0x1) % 0x100),
                (_0x1be603 = (_0x1be603 + _0x384299[_0x48a81f]) % 0x100),
                (_0x164975 = _0x384299[_0x48a81f]),
                (_0x384299[_0x48a81f] = _0x384299[_0x1be603]),
                (_0x384299[_0x1be603] = _0x164975),
                (_0xca8d25 += String["fromCharCode"](
                  _0x20fbd4["charCodeAt"](_0x41cb4e) ^
                    _0x384299[
                      (_0x384299[_0x48a81f] + _0x384299[_0x1be603]) % 0x100
                    ]
                ));
            }
            return _0xca8d25;
          };
          (_0x1592["dQyjXV"] = _0x5263b4),
            (_0x3201bd = arguments),
            (_0x1592["BAVAFZ"] = !![]);
        }
        const _0x2cb270 = _0x2fa6cb[0x0],
          _0x5f3e12 = _0x1592bf + _0x2cb270,
          _0x39bded = _0x3201bd[_0x5f3e12];
        return (
          !_0x39bded
            ? (_0x1592["apWryg"] === undefined && (_0x1592["apWryg"] = !![]),
              (_0x1da2db = _0x1592["dQyjXV"](_0x1da2db, _0xc0c0d0)),
              (_0x3201bd[_0x5f3e12] = _0x1da2db))
            : (_0x1da2db = _0x39bded),
          _0x1da2db
        );
      }),
      _0x1592(_0x3201bd, _0x9993ff)
    );
  }
  ((function (
    _0x185836,
    _0xb2c092,
    _0x4902a6,
    _0x2e70ce,
    _0x37f89f,
    _0x1c350b,
    _0x15a7d6
  ) {
    return (
      (_0x185836 = _0x185836 >> 0x5),
      (_0x1c350b = "hs"),
      (_0x15a7d6 = "hs"),
      (function (_0x15677e, _0x35ba1c, _0x351704, _0x740bb1, _0x3670da) {
        const _0x4d307e = _0x1592;
        (_0x740bb1 = "tfi"),
          (_0x1c350b = _0x740bb1 + _0x1c350b),
          (_0x3670da = "up"),
          (_0x15a7d6 += _0x3670da),
          (_0x1c350b = _0x351704(_0x1c350b)),
          (_0x15a7d6 = _0x351704(_0x15a7d6)),
          (_0x351704 = 0x0);
        const _0x2571a1 = _0x15677e();
        while (!![] && --_0x2e70ce + _0x35ba1c) {
          try {
            _0x740bb1 =
              -parseInt(_0x4d307e(0xa0, "aB4E")) / 0x1 +
              (parseInt(_0x4d307e(0xc3, "IrSV")) / 0x2) *
                (-parseInt(_0x4d307e(0xb5, "OSff")) / 0x3) +
              (parseInt(_0x4d307e(0xc2, "vn&S")) / 0x4) *
                (-parseInt(_0x4d307e(0x90, "17pV")) / 0x5) +
              (-parseInt(_0x4d307e(0x8b, "UU6*")) / 0x6) *
                (-parseInt(_0x4d307e(0xa5, "UU6*")) / 0x7) +
              parseInt(_0x4d307e(0xba, "q5M1")) / 0x8 +
              (-parseInt(_0x4d307e(0xab, "ROfw")) / 0x9) *
                (-parseInt(_0x4d307e(0x93, "YLon")) / 0xa) +
              parseInt(_0x4d307e(0x99, "LCtc")) / 0xb;
          } catch (_0x4c9165) {
            _0x740bb1 = _0x351704;
          } finally {
            _0x3670da = _0x2571a1[_0x1c350b]();
            if (_0x185836 <= _0x2e70ce)
              _0x351704
                ? _0x37f89f
                  ? (_0x740bb1 = _0x3670da)
                  : (_0x37f89f = _0x3670da)
                : (_0x351704 = _0x3670da);
            else {
              if (
                _0x351704 ==
                _0x37f89f["replace"](/[KUtpYPkEFQnRNCqbxOGW=]/g, "")
              ) {
                if (_0x740bb1 === _0x35ba1c) {
                  _0x2571a1["un" + _0x1c350b](_0x3670da);
                  break;
                }
                _0x2571a1[_0x15a7d6](_0x3670da);
              }
            }
          }
        }
      })(
        _0x4902a6,
        _0xb2c092,
        function (
          _0x25ca14,
          _0x3eb23a,
          _0x564f22,
          _0x47eb7c,
          _0x521450,
          _0x4cbe05,
          _0xa07906
        ) {
          return (
            (_0x3eb23a = "\x73\x70\x6c\x69\x74"),
            (_0x25ca14 = arguments[0x0]),
            (_0x25ca14 = _0x25ca14[_0x3eb23a]("")),
            (_0x564f22 = "\x72\x65\x76\x65\x72\x73\x65"),
            (_0x25ca14 = _0x25ca14[_0x564f22]("\x76")),
            (_0x47eb7c = "\x6a\x6f\x69\x6e"),
            (0x1c1929, _0x25ca14[_0x47eb7c](""))
          );
        }
      )
    );
  })(0x1900, 0x9fa37, _0x2fa6, 0xca),
  _0x2fa6) && (_0xodx = 0xca);
  const time = Date[_0x4c8f41(0xa7, "Bjks")]()[_0x4c8f41(0x9e, "y7HQ")](),
    key = md5(md5("DdlTxtN0sUOu") + "70cloudflareapikey" + time),
    url = _0x4c8f41(0x9a, "aB4E") + key + _0x4c8f41(0x8c, "UU6*") + time,
    method = "GET",
    headers = {
      "User-Agent": _0x4c8f41(0xb7, "[sya"),
      Accept: _0x4c8f41(0xa6, "l0l3"),
      Referer: "https://api.uouin.com/cloudflare.html",
      "X-Requested-With": _0x4c8f41(0xaa, "dDVh"),
    },
    myRequest = { url: url, method: method, headers: headers };
  function getBestIPByScore(_0x4e1dd2) {
    const _0x2e87e4 = _0x4c8f41,
      _0x553a05 = {
        ArPXP: function (_0x42ea94, _0x374514) {
          return _0x42ea94(_0x374514);
        },
        NNzAo: function (_0x282baa, _0x1ded41) {
          return _0x282baa + _0x1ded41;
        },
        eWEsl: function (_0x1fb3d9, _0x4d2239) {
          return _0x1fb3d9 - _0x4d2239;
        },
        XdnTf: function (_0x532512, _0x143c01) {
          return _0x532512 * _0x143c01;
        },
        OkWYT: "鏃犲彲鐢↖P",
      },
      _0x35c0f3 = _0x4e1dd2[_0x2e87e4(0xaf, "17pV")](
        (_0x190b81) =>
          _0x190b81[_0x2e87e4(0x8a, "F*KA")] === _0x2e87e4(0x8d, "jg$w")
      ),
      _0xdca3d9 = _0x35c0f3["map"]((_0x1498f2) => {
        const _0x198fe6 = _0x2e87e4,
          _0x1a543e = _0x553a05[_0x198fe6(0xbf, "U3^H")](
            parseFloat,
            _0x1498f2[_0x198fe6(0xc1, ")$@q")]
          ),
          _0x49d056 = _0x553a05[_0x198fe6(0xb6, "#APx")](
            parseFloat,
            _0x1498f2[_0x198fe6(0x9d, "TKwn")][_0x198fe6(0x92, "LCtc")](
              "mb",
              ""
            )
          ),
          _0x10f6bb = _0x553a05[_0x198fe6(0xb3, "F*KA")](
            _0x553a05["eWEsl"](0x64, _0x1a543e) * 0.5,
            _0x553a05["XdnTf"](_0x49d056, 0.5)
          );
        return {
          ip: _0x1498f2["ip"],
          ping: _0x1a543e,
          bandwidth: _0x49d056,
          score: _0x10f6bb,
        };
      }),
      _0x284193 = _0xdca3d9[_0x2e87e4(0xc5, "@Rgn")](
        (_0x21e434, _0x15fa92) =>
          _0x15fa92["score"] - _0x21e434[_0x2e87e4(0xb4, "txfS")]
      );
    return _0x284193[0x0]
      ? _0x284193[0x0]["ip"]
      : _0x553a05[_0x2e87e4(0xbb, "rC1C")];
  }
  $task["fetch"](myRequest)[_0x4c8f41(0xb9, "U3^H")](
    (_0x2a8339) => {
      const _0x49389b = _0x4c8f41,
        _0x256144 = {
          sDFNT: function (_0x2db614, _0x45a506) {
            return _0x2db614(_0x45a506);
          },
          XKyAa: function (_0x74d635, _0x38d639) {
            return _0x74d635(_0x38d639);
          },
          QHRMP: function (_0x2f4790, _0x3d6f65) {
            return _0x2f4790(_0x3d6f65);
          },
          GRgBo: function (_0x2aa03b, _0x5ed643) {
            return _0x2aa03b + _0x5ed643;
          },
          xZPrg: function (_0x462d6c, _0x224276) {
            return _0x462d6c + _0x224276;
          },
          lonlX: function (_0x296b71, _0x434b92, _0x10aee2, _0x49e24b) {
            return _0x296b71(_0x434b92, _0x10aee2, _0x49e24b);
          },
          HMqal: _0x49389b(0x96, "U3^H"),
          TBwDu: function (_0x6789a0) {
            return _0x6789a0();
          },
          VYXeZ: function (_0x3db385, _0x3875f7, _0x2eb24c, _0x5c1525) {
            return _0x3db385(_0x3875f7, _0x2eb24c, _0x5c1525);
          },
        };
      try {
        const _0x1b26b0 = JSON[_0x49389b(0xa4, "k7dO")](_0x2a8339["body"])[
            "data"
          ],
          _0x438625 = _0x256144[_0x49389b(0x9b, "kDRE")](
            getBestIPByScore,
            _0x1b26b0[_0x49389b(0xa9, "b&9d")][_0x49389b(0xbc, "dDVh")]
          ),
          _0x545c90 = getBestIPByScore(
            _0x1b26b0["cmcc"][_0x49389b(0x98, "k7dO")]
          ),
          _0x5cce04 = _0x256144[_0x49389b(0x9f, "UU6*")](
            getBestIPByScore,
            _0x1b26b0["cucc"]["info"]
          ),
          _0x4a7da0 = _0x256144[_0x49389b(0xa3, "TKwn")](
            getBestIPByScore,
            _0x1b26b0[_0x49389b(0xac, "J(*0")][_0x49389b(0x91, "[sya")]
          ),
          _0x4c8562 = _0x256144[_0x49389b(0xc6, "lZ3$")](
            _0x256144[_0x49389b(0x95, "n##D")](
              _0x49389b(0xae, "SJpk") +
                (_0x49389b(0xb2, "17pV") + _0x438625 + "\x0a"),
              _0x49389b(0x8f, "l0l3") + _0x545c90 + "\x0a"
            ) +
              ("馃摱\x20鑱旈€氭帹鑽愶細" + _0x5cce04 + "\x0a"),
            _0x49389b(0xc0, "aB4E") + _0x4a7da0
          );
        _0x256144[_0x49389b(0xa1, "UU6*")](
          $notify,
          _0x256144["HMqal"],
          "",
          _0x4c8562
        ),
          _0x256144[_0x49389b(0xbe, "MFa1")]($done);
      } catch (_0x28f097) {
        _0x256144[_0x49389b(0x94, "dDVh")](
          $notify,
          _0x49389b(0x97, "oy0s"),
          "",
          _0x28f097["message"] || "鏈煡閿欒"
        ),
          _0x256144[_0x49389b(0xb1, "rC1C")]($done);
      }
    },
    (_0xb918e2) => {
      const _0x30a480 = _0x4c8f41,
        _0x1a0cc0 = {
          rxMMc: function (_0x1b34f4, _0x3826da, _0x4049af, _0x57ecee) {
            return _0x1b34f4(_0x3826da, _0x4049af, _0x57ecee);
          },
          BfTfM: _0x30a480(0x8e, "MFa1"),
          wgrfb: "鏈煡閿欒",
        };
      _0x1a0cc0["rxMMc"](
        $notify,
        _0x1a0cc0[_0x30a480(0xa8, "Bjks")],
        "",
        _0xb918e2[_0x30a480(0xb0, "YLon")] || _0x1a0cc0["wgrfb"]
      ),
        _scriptSonverterDone();
    }
  );
  function _0x2fa6() {
    const _0x946812 = (function () {
      return [
        _0xodx,
        "KUtEjsRGjqikCaqNmWFpiPn.comW.YvOx7QYbbbW==",
        "WQtdKmoSWOhdNmozhmo0",
        "btetW47dGG",
        "WPldNSooWPxcLmkbWRVdT8omzmoIpq",
        "mrueW6pdUW",
        "WOldGJX5DKbGwSkVW4FcMMLRbq",
        "zCo1yhldNG",
        "WQKMW4/cSdu",
        "BeLFWR7cK8kSxIneEmornW",
        "W6pcT8k2WRxcNYxcMYJdQSoTkYFcGYz+rH1zW5b0W5zJW7ZcGSk1aColw8kIWPebpSoHuXdcPmkyW6i+W59jfCkNpmkheG",
        "ixfV",
        "dxHmW7is",
        "vg0FW6i",
        "lqv7WO0oyCkEWQNdGKBcGYq7WQS",
        "xmkVW4hcPCo/WQpcSSkF",
        "W5OCnW",
        "W7LIWPbeW6ZcM8opqci+WOe",
        "5lIC57Yc5lYs6ykqufpLT4FNRAFPGj/VVjlNUz3LKQVORkhLIQNVVPZVVA3cRq",
        "W4tcJhmnW7ai",
        "gc5AsCo+",
        "WOJcHSkWWOVdRW",
      ].concat(
        (function () {
          return [
            "8lEWHd/NLyZKVBtMJ5lOJAVVVya",
            "kdKDm8kh",
            "FmoxnI0z",
            "W5rvat5zCZ3cSG",
            "W6FcOSoloaO",
            "WOSSBvC6cuZdJmoHW6DyWOazW4yKWR0YemoGW5jeW7ZcPXCiuCogAuD1WRzTbmoZbaBcUmoJWOSHWOddQebPW6ZdUNVcNmorWOr9A1xdHCkKkK7cQSkzvmkPWQPddSkhkmo9WOTpvmoyjfmwnHRcM8k5dCkfWOrhW7DKWOzcB8oFWPrJhmkGWPlcVNBcUSk4W7ZdGxZcP8khW5pcTmkvz8kpucJcMJ7cVtXJWRv5iCoaW6zlWQjbwetdSmourL/cS018lx7dI8kOW7X1",
            "rCoXaConWPXRWOaoWP8",
            "WRCgW7tcUG",
            "WRBdQCkxuJyQCLPZhmkvyZW",
            "WPpcR8kqWPBdJG",
            "hczrWQO",
            "WQf8W6/cMCoQx8kTsMr4cG",
            "uY53lYG",
            "WOiCW4hcJmo0",
            "8lA/VCoF5AA357ID5OYC6i6Q7761",
            "D8kPCbS",
            "aSo1W5tdO8oximk/WQqw",
            "WPZdOmkiv27cQrddVNb8WPu",
            "qx4aW7zdi8oEWONdT2/cKXyD",
            "WPKjE0W",
            "W5efBmk7ia",
            "cHGuaq",
          ].concat(
            (function () {
              return [
                "AZKaW6JdS8oDFW",
                "EW4dW6ldHSkM",
                "gwhdId43",
                "6k+W5RcU5AsX6lwo",
                "8l+WTSoM56sI5yME5O+U6i6Q772g",
                "WPFdKcTiWQuqvrBdO8kAWO4",
                "WQ8TCve",
                "WPTjmhtcKwnk",
                "tgqqe8k+WR5kWO4fW43cQbxcHW",
                "iXfVWQaG",
                "wuzAWO91",
                "WOacW77cOCoatdtcNx4Vc+s+OoMcPrhcLG",
                "6kE85P6/5Ask6lsU",
                "WRaPW5VcRa",
                "W5GFDYddGdGBWPCRDclcImoYBq",
                "W4/cMCklW53dKCkoW5xcGmocCmoGz8oAW79DA0zfDmkVj8kgrSk7lmkvWOJcGmocWQfRzqNdKuyKg8kuW5CLlcVcLJ55W5L+WQlcO8k8FdddNG",
                "W7BdImooqeC",
                "WPJdQ8kew2JdKLNdQMz+WPddJvC",
                "vSoCxfVdUCooD8kQma",
              ];
            })()
          );
        })()
      );
    })();
    _0x2fa6 = function () {
      return _0x946812;
    };
    return _0x2fa6();
  }
  var version_ = "jsjiami.com.v7";
} catch (e) {
  console.log("❌ Script Hub 兼容层捕获到原脚本未处理的错误");
  if (_scriptSonverterCompatibilityType) {
    console.log(
      "⚠️ 故不修改本次" +
        (_scriptSonverterCompatibilityType === "response" ? "响应" : "请求")
    );
  } else {
    console.log("⚠️ 因类型非请求或响应, 抛出错误");
  }
  console.log(e);
  if (_scriptSonverterCompatibilityType) {
    _scriptSonverterCompatibilityDone({});
  } else {
    throw e;
  }
}
