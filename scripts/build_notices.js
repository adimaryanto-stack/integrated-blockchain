const fs = require('fs');
const path = require('path');

const packages = JSON.parse(fs.readFileSync('scripts/audit_results.json', 'utf8'));

let md = `# 📜 Third-Party Software Notices and Information
### Dokumen Pemberitahuan Hak Cipta & Lisensi Kode Pihak Ketiga

> **Pemberitahuan Hukum (Legal Notice)**:  
> Dokumen ini disusun untuk keperluan kepatuhan lisensi sumber terbuka (*open-source compliance*) serta pemenuhan persyaratan pendaftaran **Hak Kekayaan Intelektual (HKI / Hak Cipta Program Komputer)** pada **Direktorat Jenderal Kekayaan Intelektual (DJKI) Kementerian Hukum dan Hak Asasi Manusia Republik Indonesia**.

---

## 🏛️ Pernyataan Batas Hak Kekayaan Intelektual (Statement of IP Boundary)

Sistem **Integrated Blockchain - Platform Transparansi Anggaran Pendidikan Indonesia** diciptakan oleh **adimaryanto** sebagai Pemegang Hak Cipta dan Pemilik Eksklusif atas karya cipta orisinal berikut:

1. **Arsitektur Sistem Terintegrasi 10 Port**: Desain topologi, protokol komunikasi, dan orkestrasi 8 aplikasi dashboard terhubung (:2019-:2028).
2. **Kode Sumber Logika Aplikasi Frontend & Backend**: Seluruh kode orisinal pada:
   - \`apps/dashboard-publik\` (Port 2019: Portal Civic-Tech Vite)
   - \`apps/transparansi-anggaran/apps/web-next\` (Port 2020: Portal Transparansi Publik Next.js)
   - \`apps/dashboard-kementerian\` (Port 2021: Penetapan Pagu & Alokasi Nasional)
   - \`apps/dashboard-bank\` (Port 2022: Rekapitulasi Kas & Rekening Escrow)
   - \`apps/dashboard-auditor\` (Port 2023: Pengawasan Audit BPK & Deteksi Anomali AI)
   - \`apps/dashboard-institusi-pendidikan\` (Port 2024: RAB Sekolah, SPJ & OCR Belanja)
   - \`apps/dashboard-apbd\` (Port 2025: Validasi Kepatuhan Mandatori 20% APBD Lampung)
   - \`apps/dashboard-admin\` (Port 2026: Super-Admin Console & Scoped RBAC)
   - \`proxy/proxy.js\` (Port 2028: PostgREST REST API Gateway & Security Filter Engine)
3. **Skema & Desain Basis Data Relasional**: Struktur 35+ tabel master, relasi entitas (*ERD*), view agregasi (*materialized view*), dan trigger otomatis (*cascading delete*) pada PostgreSQL.
4. **Logika Bisnis & Algoritma Khusus**: Formula distribusi transfer dana berjenjang, validasi ambang batas 20% APBD (UUD 1945), rekonsiliasi kas bank multi-rekening, dan alur pelaporan korupsi dana pendidikan.

---

### 🤝 Pengakuan Hak Cipta Pihak Ketiga (Third-Party Acknowledgement)

Perangkat lunak ini memanfaatkan pustaka, kerangka kerja (*framework*), font, dan dependensi sumber terbuka (*open-source software*) yang dilisensikan di bawah lisensi permisif (seperti MIT, Apache 2.0, BSD, ISC, dan SIL Open Font License).

**Hak cipta, merek dagang, dan kepemilikan atas pustaka pihak ketiga tersebut tetap sepenuhnya menjadi hak milik para pencipta, pengembang, dan kontributor aslinya masing-masing.** 

Pencantuman dalam proyek ini dilakukan semata-mata sebagai dependensi fungsional sesuai dengan syarat dan ketentuan lisensi masing-masing pustaka.

---

## 📦 Daftar Dependensi Pustaka Pihak Ketiga (Direct Dependencies)

Berikut adalah daftar lengkap 52 dependensi pustaka open source yang digunakan di dalam proyek, beserta jenis lisensi, pemegang hak cipta, dan repositori sumber aslinya:

| No | Nama Paket | Tipe Dependensi | Lisensi | Pemegang Hak Cipta / Author | Tautan Repositori Sumber |
|:---:|---|:---:|:---:|---|---|
`;

packages.forEach((p, idx) => {
  const num = idx + 1;
  const author = p.author || 'Open Source Contributors';
  let repoLink = '-';
  if (p.repository) {
    let url = p.repository.trim();
    if (!url.startsWith('http')) {
      url = 'https://github.com/' + url.replace(/^git@github\.com:/, '').replace(/^git:\/\/github\.com\//, '').replace(/^ssh:\/\/git@github\.com\//, '');
    }
    repoLink = `[\`${p.name}\`](${url})`;
  }
  md += `| ${num} | \`${p.name}\` | ${p.type === 'production' ? 'Production' : 'Dev'} | **${p.license}** | ${author} | ${repoLink} |\n`;
});

md += `\n---

## 🎨 Aset Tipografi, Ikonografi, Peta & Data Publik

Selain pustaka perangkat lunak di atas, proyek ini memanfaatkan aset pendukung berikut dengan atribusi lisensi masing-masing:

### 1. Tipografi (Fonts)
- **Plus Jakarta Sans**
  - Desainer: Gumpita Rahayu, Tokotype Studio (Bandung, Indonesia).
  - Lisensi: **SIL Open Font License, Version 1.1 (OFL-1.1)**
  - Tautan: [https://github.com/tokotype/PlusJakartaSans](https://github.com/tokotype/PlusJakartaSans)
  - Copyright (c) 2020, Tokotype (tokotype.com)
- **JetBrains Mono**
  - Desainer: Philipp Nurullin, Konstantin Bulenkov, JetBrains.
  - Lisensi: **SIL Open Font License, Version 1.1 (OFL-1.1)**
  - Tautan: [https://github.com/JetBrains/JetBrainsMono](https://github.com/JetBrains/JetBrainsMono)
  - Copyright (c) 2020, JetBrains s.r.o.
- **Caveat**
  - Desainer: Pablo Impallari.
  - Lisensi: **SIL Open Font License, Version 1.1 (OFL-1.1)**
  - Tautan: [https://github.com/googlefonts/caveat](https://github.com/googlefonts/caveat)

### 2. Ikonografi (Icons)
- **Lucide Icons (\`lucide-react\`)**
  - Lisensi: **ISC License**
  - Tautan: [https://github.com/lucide-icons/lucide](https://github.com/lucide-icons/lucide)
  - Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other portions Copyright (c) Lucide Contributors 2022.
- **Material Symbols Outlined**
  - Pengembang: Google LLC.
  - Lisensi: **Apache License, Version 2.0**
  - Tautan: [https://github.com/google/material-design-icons](https://github.com/google/material-design-icons)

### 3. Peta Vektor & Batas Wilayah Administrasi (Maps & Geospatial Paths)
- **Koordinat Batas Provinsi Indonesia (SVG Path Coordinates)**
  - Sumber: Representasi batas grafis 38 Provinsi Republik Indonesia berbasis data pemetaan wilayah publik.
  - Sifat Data: Domain Publik / Informasi Publik Terbuka.

### 4. Data Master Administrasi Wilayah & Anggaran Negara
- **Kode & Nomenklatur Wilayah**: Berdasarkan Keputusan Menteri Dalam Negeri (Kepmendagri) tentang Kode dan Data Wilayah Administrasi Pemerintahan.
- **Data APBN / APBD**: Berdasarkan Undang-Undang APBN Republik Indonesia dan Peraturan Daerah APBD Provinsi Lampung.
- *Catatan Hukum*: Berdasarkan **Pasal 42 Undang-Undang Republik Indonesia Nomor 28 Tahun 2014 tentang Hak Cipta**, hasil karya berupa peraturan perundang-undangan, pidato kenegaraan, putusan pengadilan, dan kitab suci tidak memiliki hak cipta (merupakan informasi publik/domain publik).

---

## 🗄️ Mesin Basis Data & Lingkungan Eksekusi (Database Engine & Runtime)

- **PostgreSQL 16**
  - Lisensi: **The PostgreSQL Licence**
  - Tautan: [https://www.postgresql.org/about/licence/](https://www.postgresql.org/about/licence/)
  - Portions Copyright (c) 1996-2024, PostgreSQL Global Development Group.
  - Portions Copyright (c) 1994, The Regents of the University of California.
- **Node.js**
  - Lisensi: **MIT License**
  - Tautan: [https://nodejs.org/](https://nodejs.org/)
  - Copyright Node.js contributors. All rights reserved.

---

## 📜 Salinan Teks Lisensi Sumber Terbuka Pihak Ketiga (Full License Texts)

### 1. The MIT License
\`\`\`
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
\`\`\`

---

### 2. Apache License, Version 2.0
\`\`\`
                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.
      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      patent license to make, have made, use, offer to sell, sell, import,
      and otherwise transfer the Work.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:
      (a) You must give any other recipients of the Work or Derivative Works
          a copy of this License; and
      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and
      (c) You must retain, in the Source form of any Derivative Works that
          You distribute, all copyright, patent, trademark, and attribution
          notices from the Source form of the Work; and
      (d) If the Work includes a "NOTICE" text file as part of its distribution,
          then any Derivative Works that You distribute must include a readable
          copy of the attribution notices contained within such NOTICE file.

   5. Disclaimer of Warranty. Unless required by applicable law or agreed to
      in writing, Licensor provides the Work (and each Contributor provides
      its Contributions) on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS
      OF ANY KIND, either express or implied.
\`\`\`

---

### 3. The BSD 3-Clause License
\`\`\`
Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its
   contributors may be used to endorse or promote products derived from
   this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
\`\`\`

---

### 4. The BSD 2-Clause License
\`\`\`
Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
\`\`\`

---

### 5. The ISC License
\`\`\`
Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
\`\`\`

---

### 6. SIL Open Font License, Version 1.1 (OFL-1.1)
\`\`\`
This Font Software is licensed under the SIL Open Font License, Version 1.1.
This license is copied below, and is also available with a FAQ at:
https://openfontlicense.org

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Source or Binary forms, may be sold by itself.
2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license.
\`\`\`

---

### 7. The PostgreSQL Licence
\`\`\`
Portions Copyright (c) 1996-2024, PostgreSQL Global Development Group
Portions Copyright (c) 1994, The Regents of the University of California

Permission to use, copy, modify, and distribute this software and its
documentation for any purpose, without fee, and without a written agreement
is hereby granted, provided that the above copyright notice and this
paragraph and the following two paragraphs appear in all copies.

IN NO EVENT SHALL THE UNIVERSITY OF CALIFORNIA BE LIABLE TO ANY PARTY FOR
DIRECT, INDIRECT, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGES, INCLUDING
LOST PROFITS, ARISING OUT OF THE USE OF THIS SOFTWARE AND ITS
DOCUMENTATION, EVEN IF THE UNIVERSITY OF CALIFORNIA HAS BEEN ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.

THE UNIVERSITY OF CALIFORNIA SPECIFICALLY DISCLAIMS ANY WARRANTIES,
INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS FOR A PARTICULAR PURPOSE. THE SOFTWARE PROVIDED HEREUNDER IS
ON AN "AS IS" BASIS, AND THE UNIVERSITY OF CALIFORNIA HAS NO OBLIGATIONS TO
PROVIDE MAINTENANCE, SUPPORT, UPDATES, ENHANCEMENTS, OR MODIFICATIONS.
\`\`\`
`;

fs.writeFileSync('THIRD_PARTY_NOTICES.md', md, 'utf8');
console.log('Successfully generated THIRD_PARTY_NOTICES.md');
