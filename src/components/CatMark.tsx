export function CatMark({ hero = false }: { hero?: boolean }) {
  if (!hero)
    return (
      <svg viewBox="0 0 60 60" fill="none" aria-hidden="true">
        <path
          d="M10 22 9 7l16 10h10L51 7l-1 17c8 24-4 31-20 31S2 44 10 22Z"
          fill="#f4bc9e"
          stroke="#775548"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path d="m15 14 6 5-6 2m30-7-6 5 6 2" fill="#dc847b" />
        <path
          d="M20 32v4m20-4v4m-12 1 2 2 2-2m-2 2v4m-7-1q7 6 14 0"
          stroke="#775548"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <ellipse cx="14" cy="39" rx="5" ry="3" fill="#e99e92" />
        <ellipse cx="46" cy="39" rx="5" ry="3" fill="#e99e92" />
      </svg>
    );
  return (
    <svg
      viewBox="0 0 490 370"
      className="hero-cat"
      fill="none"
      role="img"
      aria-label="น้องแมวน้ำหวานกับของน่ารักที่คัดให้"
    >
      <ellipse
        cx="245"
        cy="330"
        rx="190"
        ry="18"
        fill="#d9b8a2"
        opacity=".25"
      />
      <path
        d="M138 297c-75-10-96-64-55-94 10-8 18 2 11 12-17 26 9 42 44 41"
        fill="#e8b48d"
        stroke="#805c4b"
        strokeWidth="3"
      />
      <path
        d="M159 194c-36 47-38 82-29 107 24 32 148 27 169-6 11-35-5-76-38-111"
        fill="#f2c6a1"
        stroke="#805c4b"
        strokeWidth="3"
      />
      <ellipse cx="216" cy="258" rx="46" ry="53" fill="#fff2df" />
      <path
        d="m135 91 2-58 55 29c20-6 45-5 63 1l57-31-4 64c45 77 10 131-85 131-94 0-133-60-88-136Z"
        fill="#f2c6a1"
        stroke="#805c4b"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path d="m148 49 2 37 28-17m119-22-3 41-27-19" fill="#e99e92" />
      <path
        d="M208 58v23m15-25v26m15-23v24"
        stroke="#d99c75"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d="M167 135q12-13 23 0m68 0q12-13 23 0"
        stroke="#805c4b"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="m216 146 7 5 7-5m-7 6v9m-16-2q16 17 33 0"
        stroke="#805c4b"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <ellipse cx="153" cy="155" rx="15" ry="8" fill="#eba095" />
      <ellipse cx="290" cy="155" rx="15" ry="8" fill="#eba095" />
      <path
        d="m115 146 27 4m-29 13 29-4m165-9 29-4m-29 13 29 4"
        stroke="#b38469"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="m172 226 16 37m70-38-13 37"
        stroke="#805c4b"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <rect
        x="161"
        y="249"
        width="122"
        height="74"
        rx="7"
        fill="#fbddd5"
        stroke="#805c4b"
        strokeWidth="3"
      />
      <path
        d="M174 249q7-31 17-3m55 3q7-31 18-3"
        stroke="#805c4b"
        strokeWidth="3"
      />
      <path
        d="M203 279c-11-10-20 2-9 12l28 20 28-20c11-10 2-22-9-12l-19 13Z"
        fill="#d88680"
      />
      <rect
        x="318"
        y="242"
        width="74"
        height="76"
        rx="10"
        fill="#fdf7eb"
        stroke="#b88870"
        strokeWidth="3"
      />
      <path
        d="M392 257h11c20 0 20 35-11 35m-63-53q24-11 51 0"
        stroke="#b88870"
        strokeWidth="3"
      />
      <path d="m341 270 3-10 9 7 10-7 3 10c12 19-30 19-25 0Z" fill="#e4ad86" />
      <path
        d="M319 195q-14-13-22 0c-8 14 16 29 22 33 6-4 30-19 22-33-8-13-22 0-22 0Z"
        fill="#e29f93"
      />
      <path
        d="m74 91 4 10 12 2-10 7 1 12-9-8-11 3 4-10-7-9 12-1Z"
        fill="#deb47d"
      />
      <path
        d="m379 126 4 10 12 2-10 7 1 12-9-8-11 3 4-10-7-9 12-1Z"
        fill="#deb47d"
      />
      <path
        d="m356 67 12-17m-2 28 20-6"
        stroke="#c0a488"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect
        x="47"
        y="173"
        width="96"
        height="37"
        rx="18"
        fill="#fffaf3"
        transform="rotate(-10 47 173)"
      />
      <text
        x="62"
        y="194"
        fill="#805c4b"
        fontSize="14"
        transform="rotate(-10 62 194)"
      >
        picked with ♡
      </text>
    </svg>
  );
}
