"use strict";
(function (M) {
  const outline = "#33251c";
  const svg = (body) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="144" viewBox="0 0 128 144"><defs><linearGradient id="red" x2=".8" y2="1"><stop stop-color="#ff7d62"/><stop offset=".45" stop-color="#ec3629"/><stop offset="1" stop-color="#a91420"/></linearGradient><linearGradient id="green" x2="1" y2=".5"><stop stop-color="#a3eb3c"/><stop offset=".4" stop-color="#51bd25"/><stop offset="1" stop-color="#167330"/></linearGradient><linearGradient id="brown" x2=".3" y2="1"><stop stop-color="#ed9a49"/><stop offset=".48" stop-color="#b65a26"/><stop offset="1" stop-color="#72351c"/></linearGradient><linearGradient id="blue" x2=".8" y2="1"><stop stop-color="#a2eeff"/><stop offset=".5" stop-color="#36bcf4"/><stop offset="1" stop-color="#246ac7"/></linearGradient><radialGradient id="gold" cx=".35" cy=".25"><stop stop-color="#fff0a0"/><stop offset=".55" stop-color="#ffca36"/><stop offset="1" stop-color="#e68d1d"/></radialGradient><radialGradient id="dark" cx=".3" cy=".22"><stop stop-color="#9299cd"/><stop offset=".35" stop-color="#414d83"/><stop offset="1" stop-color="#171f3d"/></radialGradient><linearGradient id="skin" x2=".5" y2="1"><stop stop-color="#fff4c6"/><stop offset="1" stop-color="#e9ae67"/></linearGradient></defs><g stroke="${outline}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">${body}</g></svg>`;
  const ellipse = (cx, cy, rx, ry, fill, extra = "") =>
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
  const eyes = (x = 64, y = 70, space = 13) =>
    `${ellipse(x - space, y, 5, 10, "#262724", 'stroke="none"')}${ellipse(x + space, y, 5, 10, "#262724", 'stroke="none"')}${ellipse(x - space - 1, y - 4, 1.5, 3, "white", 'stroke="none"')}${ellipse(x + space - 1, y - 4, 1.5, 3, "white", 'stroke="none"')}`;
  const leaves = `<path d="M62 126 Q23 135 14 108 Q41 103 62 123 M67 126 Q84 97 113 105 Q103 135 67 129" fill="url(#green)"/><path d="M27 115 L57 126 M98 113 L74 125" fill="none" stroke="#238433" stroke-width="2"/>`;
  const stem = `<path d="M60 129 Q69 103 60 80 L72 80 Q77 105 70 131" fill="url(#green)"/>${leaves}`;
  const feet = `${ellipse(39, 128, 22, 11, "#6c4628")}${ellipse(88, 128, 22, 11, "#6c4628")}`;
  const angry = `${ellipse(48, 74, 13, 19, "#fff6d8")}${ellipse(80, 74, 13, 19, "#fff6d8")}${eyes(64, 79, 15)}<path d="M30 52 L57 66 M98 52 L71 66" stroke="#352a20" stroke-width="9"/><path d="M49 103 Q64 95 81 103" fill="none"/>`;
  const goomba = (giant = false, wings = false) =>
    `${wings ? '<path d="M32 82 Q-1 77 5 27 Q18 37 23 51 Q16 23 28 16 Q32 46 50 60 M96 82 Q129 77 123 27 Q110 37 105 51 Q112 23 100 16 Q96 46 78 60" fill="#fff9e8" stroke="#b8c3d0"/>' : ""}${feet}${ellipse(64, 105, 31, 25, "url(#skin)")}<path d="M11 88 Q5 69 30 39 Q47 17 64 18 Q82 17 101 41 Q126 72 117 89 Q108 107 87 99 Q64 89 42 100 Q22 108 11 88Z" fill="url(#brown)"/>${giant ? `${ellipse(57, 32, 20, 13, "#ffe6a5", 'stroke="none"')}${ellipse(101, 60, 13, 18, "#ffe6a5", 'stroke="none"')}${ellipse(22, 67, 12, 18, "#ffe6a5", 'stroke="none"')}` : ""}${angry}<path d="M37 94 L41 111 L49 99 M88 99 L96 110 L98 93" fill="white" stroke-width="2"/>`;
  const koopa = (hammer = false) =>
    `${feet}${ellipse(49, 86, 36, 40, "url(#green)")}<path d="M25 57 L55 51 L74 76 L68 105 L39 116 L18 94Z M28 57 L34 79 L20 94 M34 79 L60 81 L68 105 M60 81 L74 76" fill="none" stroke="#174c2d"/>${ellipse(73, 98, 26, 31, "url(#gold)")}<path d="M56 92 Q74 101 91 91 M53 105 Q73 115 92 104" fill="none" stroke="#bd832c" stroke-width="2"/>${ellipse(93, 64, 24, 18, "url(#gold)")}${ellipse(74, 48, 24, 30, "url(#gold)")}${ellipse(79, 47, 9, 17, "white")}${ellipse(83, 48, 4, 10, "#242c25", 'stroke="none"')}<path d="M91 72 Q102 76 110 69" fill="none"/>${ellipse(42, 91, 12, 21, "url(#gold)")}${hammer ? '<path d="M51 34 Q49 6 77 8 Q105 7 106 37Z" fill="url(#red)"/><path d="M72 9 L74 32 L88 32 L87 11" fill="#fff7df"/><path d="M48 33 Q76 23 109 36 L107 46 Q78 36 49 44Z" fill="#fefbea"/><path d="M38 81 L23 30" stroke="#7e5430" stroke-width="9"/><rect x="5" y="16" width="43" height="24" rx="6" fill="#7e868a"/><path d="M12 20 L12 35" stroke="#d7d6d1"/>' : ""}`;
  const assets = {
    toad: svg(
      `${feet}<path d="M40 94 L37 122 Q64 135 91 121 L86 91Z" fill="#fff2ce"/><path d="M40 90 L33 119 L46 121 L50 95 M82 92 L78 119 L92 118 L90 92" fill="#f3bb34"/>${ellipse(31, 105, 10, 14, "url(#skin)")}${ellipse(95, 105, 10, 14, "url(#skin)")}${ellipse(64, 79, 31, 29, "url(#skin)")}<path d="M13 68 Q2 53 19 27 Q36 5 64 6 Q96 6 112 32 Q126 57 114 69 Q94 81 64 71 Q35 80 13 68Z" fill="url(#red)"/>${ellipse(65, 24, 25, 16, "#fff9e8", 'stroke="none"')}${ellipse(23, 47, 10, 17, "#fff9e8", 'transform="rotate(25 23 47)" stroke="none"')}${ellipse(107, 47, 9, 17, "#fff9e8", 'transform="rotate(-25 107 47)" stroke="none"')}${eyes(64, 83, 12)}<path d="M55 97 Q64 107 73 97" fill="#a63322" stroke-width="2"/>`,
    ),
    piranha: svg(
      `${stem}<path d="M35 91 Q14 77 20 47 Q27 23 55 22 Q83 18 106 41 L66 65 L111 77 Q88 108 57 101Z" fill="url(#red)"/><path d="M105 41 Q86 39 64 58 Q55 65 66 73 L110 77" fill="#5b1e24" stroke="#fff8dc" stroke-width="9"/><path d="M81 47 L83 58 L91 44 M69 54 L73 64 L81 48 M74 77 L78 87 L84 78 M94 79 L95 87 L103 79" fill="#fffbee" stroke="none"/>${ellipse(45, 38, 11, 8, "#fff6e3", 'stroke="none"')}${ellipse(32, 68, 7, 11, "#fff6e3", 'stroke="none"')}${ellipse(56, 90, 9, 6, "#fff6e3", 'stroke="none"')}<path d="M41 113 Q28 92 22 97 Q24 118 44 121" fill="url(#green)"/>`,
    ),
    fire: svg(
      `${stem}${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse cx="64" cy="36" rx="19" ry="23" transform="rotate(${a} 64 62)" fill="url(#red)" stroke="#a84016"/>`).join("")}${ellipse(64, 62, 31, 32, "url(#gold)")}${eyes(64, 62, 11)}<path d="M37 39 Q47 31 56 32" stroke="#ffe18a" stroke-width="5" fill="none"/>`,
    ),
    ice: svg(
      `${stem}${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse cx="64" cy="36" rx="19" ry="23" transform="rotate(${a} 64 62)" fill="url(#blue)" stroke="#2466a8"/>`).join("")}${ellipse(64, 62, 31, 32, "#dcfaff", 'stroke="#277bbb"')}${eyes(64, 62, 11)}<path d="M37 39 Q47 31 56 32" stroke="#e3ffff" stroke-width="5" fill="none"/>`,
    ),
    bomb: svg(
      `${ellipse(39, 128, 24, 12, "url(#gold)")}${ellipse(93, 128, 23, 12, "url(#gold)")}<path d="M27 87 L13 87 L13 69 M13 73 C-4 60 26 52 24 68 C24 79 2 81 5 92 C8 102 25 95 19 87" fill="none" stroke="#9b6824" stroke-width="7"/><path d="M63 35 Q66 15 82 20 L89 11" fill="none" stroke="#aa7442" stroke-width="6"/><path d="M83 10 L88 1 L92 10 L103 8 L96 17 L102 24 L92 23 L88 34 L85 22 L75 25 L80 17 L75 10Z" fill="#ffdb39" stroke="#ed8b23" stroke-width="2"/><rect x="50" y="29" width="28" height="15" rx="5" fill="#b3b7c5"/>${ellipse(67, 83, 45, 44, "url(#dark)")}${ellipse(69, 74, 5, 13, "white", 'stroke="none"')}${ellipse(88, 74, 5, 13, "white", 'stroke="none"')}<path d="M36 63 Q40 51 51 48" fill="none" stroke="#c4c7e1" stroke-width="5"/>`,
    ),
    pipe: svg(
      `<path d="M30 53 L30 129 Q64 140 99 129 L99 53Z" fill="url(#green)"/><path d="M43 60 L43 126 M51 64 L51 130" stroke="#bff161" stroke-width="5"/><path d="M18 27 L18 59 Q63 74 111 59 L111 27" fill="url(#green)"/>${ellipse(64, 27, 46, 16, "#76ce39")}${ellipse(64, 27, 36, 10, "#143f26")}<path d="M26 38 L26 54 M34 41 L34 58" stroke="#c4fa78" stroke-width="5"/><path d="M30 130 L20 118 L24 136 L37 137 M94 133 L107 120 L106 137 L91 139" fill="url(#green)" stroke-width="2"/>`,
    ),
    goomba: svg(goomba()),
    para: svg(goomba(false, true)),
    giant: svg(goomba(true)),
    koopa: svg(koopa()),
    hammer: svg(koopa(true)),
    shell: svg(
      `<path d="M13 104 Q12 55 61 50 Q111 48 116 101 Q68 131 13 104Z" fill="url(#green)"/><path d="M15 98 Q64 118 114 97 L113 115 Q61 136 14 115Z" fill="#fff7e4"/><path d="M42 58 L48 85 L28 104 M48 85 L83 85 L95 106 M83 85 L89 60" fill="none" stroke="#206b2a"/>`,
    ),
    shy: svg(
      `${ellipse(40, 130, 23, 10, "#263851")}${ellipse(89, 130, 23, 10, "#263851")}<path d="M29 71 Q8 87 19 112 L27 121 Q65 140 104 119 L104 83 Q107 59 97 37 Q84 13 53 25 L20 22 L29 38 Q14 52 29 71Z" fill="url(#red)"/>${ellipse(28, 91, 12, 22, "url(#red)")}${ellipse(100, 94, 11, 21, "url(#red)")}<path d="M31 111 Q65 123 99 111 L100 121 Q66 133 30 120Z" fill="#322c33"/><rect x="58" y="114" width="18" height="12" rx="2" fill="#f4ce4a"/><rect x="63" y="117" width="8" height="5" fill="#45302a" stroke="none"/>${ellipse(71, 67, 30, 39, "#fffbea")}${ellipse(61, 60, 7, 14, "#242e33", 'stroke="none"')}${ellipse(82, 59, 7, 14, "#242e33", 'stroke="none"')}${ellipse(72, 84, 4, 7, "#242e33", 'stroke="none"')}`,
    ),
    mario: svg(
      `${ellipse(41, 130, 24, 11, "#75402b")}${ellipse(88, 130, 24, 11, "#75402b")}<path d="M36 88 L27 119 L48 126 L61 114 L75 125 L98 119 L90 87Z" fill="#286fc1"/><path d="M35 72 Q65 61 94 77 L100 103 L84 109 L78 88 L50 87 L43 108 L27 100Z" fill="url(#red)"/><path d="M48 79 L45 108 Q64 119 83 108 L79 80 L70 80 L70 95 L57 95 L57 80Z" fill="#368add"/>${ellipse(30, 103, 12, 12, "#fff8e5")}${ellipse(99, 103, 12, 12, "#fff8e5")}${ellipse(51, 100, 3, 4, "#ffe773", 'stroke="none"')}${ellipse(75, 100, 3, 4, "#ffe773", 'stroke="none"')}${ellipse(64, 52, 31, 32, "url(#skin)")}${ellipse(32, 55, 9, 13, "url(#skin)")}<path d="M35 35 Q25 51 37 68 L46 62 L43 47 L51 35" fill="#613420"/>${ellipse(71, 48, 8, 14, "white")}${ellipse(74, 49, 4, 10, "#297bb7", 'stroke="none"')}${ellipse(76, 50, 2, 7, "#142235", 'stroke="none"')}<path d="M50 64 Q55 58 61 65 Q65 60 71 66 Q75 61 83 67 Q81 80 68 75 Q55 79 50 64Z" fill="#4e2d20"/>${ellipse(88, 61, 16, 12, "url(#skin)")}<path d="M32 32 Q31 7 58 6 Q89 2 99 29 Q113 28 117 38 Q99 46 74 36 Q48 41 31 37Z" fill="url(#red)"/>${ellipse(66, 23, 14, 13, "#fff8e7", 'stroke="none"')}<path d="M58 30 L59 17 L66 23 L72 17 L74 30" fill="none" stroke="#db2d27" stroke-width="3"/>`,
    ),
    coin: svg(
      `${ellipse(64, 74, 33, 47, "url(#gold)", 'stroke="#a86915" stroke-width="4"')}${ellipse(64, 74, 24, 38, "none", 'stroke="#fff29b" stroke-width="3"')}<path d="M65 48 L65 98" stroke="#c58a16" stroke-width="9"/><path d="M61 47 L61 97" stroke="#fff299" stroke-width="5"/>`,
    ),
    block: svg(
      `<rect x="17" y="29" width="94" height="94" rx="12" fill="url(#gold)" stroke="#9f5c16" stroke-width="4"/><path d="M26 46 L26 36 L101 36" fill="none" stroke="#fff1a7" stroke-width="4"/><path d="M49 60 Q48 43 67 45 Q86 46 84 62 Q83 71 68 78 L68 88" fill="none" stroke="#a56c16" stroke-width="14"/><path d="M46 56 Q46 41 64 42 Q83 43 81 59 Q80 68 65 75 L65 85" fill="none" stroke="#fffcea" stroke-width="11"/>${ellipse(65, 103, 6, 6, "#fffcea", 'stroke="none"')}${[28, 100].map((x) => [40, 112].map((y) => ellipse(x, y, 3, 3, "#a9721c", 'stroke="none"')).join("")).join("")}`,
    ),
    star: svg(
      `<path d="M64 16 L80 51 L119 56 L91 85 L98 125 L64 105 L30 125 L37 85 L9 56 L48 51Z" fill="url(#gold)" stroke="#bd7b18" stroke-width="4"/>${eyes(64, 72, 11)}`,
    ),
    shield: svg(
      `<path d="M64 20 L108 37 L102 87 Q91 119 64 133 Q37 119 26 87 L20 37Z" fill="url(#blue)" stroke="#26558d" stroke-width="4"/><path d="M43 75 L57 91 L86 56" fill="none" stroke="#edffed" stroke-width="9"/>`,
    ),
    projectile: svg(
      `${ellipse(64, 72, 27, 24, "url(#green)")}${ellipse(55, 64, 7, 6, "#d1ff96", 'stroke="none"')}`,
    ),
    fireball: svg(
      `<path d="M103 70 Q99 108 63 105 Q31 100 7 116 L29 91 L9 72 L35 73 L23 42 L53 49 Q84 37 103 70Z" fill="#f67c1b" stroke="#d74616"/>${ellipse(72, 75, 25, 24, "#ffe769", 'stroke="none"')}${ellipse(77, 72, 15, 15, "#fffcca", 'stroke="none"')}`,
    ),
    iceball: svg(
      `<path d="M11 72 L66 41 L110 72 L66 103Z" fill="#8eeaff" stroke="#287eca"/><path d="M22 72 L67 52 L97 72 L66 92Z" fill="#ecffff" stroke="none"/><path d="M67 52 L57 72 L97 72" fill="#54c8f9" stroke="none"/>`,
    ),
    hammerball: svg(
      `<path d="M57 123 L71 48" stroke="#6c482d" stroke-width="15"/><rect x="28" y="27" width="74" height="39" rx="7" fill="#747f8b"/><path d="M37 33 L37 59 M92 33 L92 59" stroke="#c7d2da" stroke-width="5"/>`,
    ),
  };
  M.Art = {
    assets,
    overrides: {
      hammer: "assets/enemies/hammer.png",
      koopa: "assets/enemies/koopa.png",
      shell: "assets/enemies/shell.png",
      shy: "assets/enemies/shy.png",
      mario: "assets/characters/mario-blue-overalls.png",
      toad: "assets/defenders/toad.png",
      piranha: "assets/defenders/piranha-transparent.png",
      fire: "assets/defenders/fire-transparent.png",
      ice: "assets/defenders/ice-transparent.png",
      bomb: "assets/defenders/bomb-transparent.png",
      pipe: "assets/defenders/pipe-transparent.png",
    },
    frames: { pipe: { crop: [270, 214, 782, 788], size: [1322, 1190] }, mario: { crop: [230, 156, 442, 590], size: [920, 920] } },
    uri(key) {
      return (
        this.overrides[key] ||
        "data:image/svg+xml;base64," + btoa(assets[key] || assets.goomba)
      );
    },
  };
})(Meadow);
