# SPEC — `forge-lab`

> App học local-first để học lại **toán**, **crypto/ZK**, **Rust**, **ML/DL**, **systems security (kiến thức nền để đọc paper USENIX Security)**, **AI trends** và **quantum computing**.
> Trọng tâm là **lý thuyết dễ hiểu + bài tập toán có gợi ý từng bước**. Giao diện **tối giản**, không màu mè.
> Spec này để đưa cho Claude Code build. Build theo **milestone** ở mục 11, mỗi milestone phải chạy được rồi mới làm tiếp.

---

## 0. Người học

- Sinh viên An toàn thông tin (UIT), nghiên cứu blockchain security, ZKP, cross-chain. Đã có paper nhưng thường dùng crypto primitive như **black box**.
- Code tốt, biết nhiều ngôn ngữ. **Hổng nền toán formal** (algebra, provable security, probability) và **hổng kiến thức systems security** để đọc hiểu paper ở các hội nghị như USENIX Security.
- **Ngại đọc sách dày**, nhưng **cần lý thuyết thật sự** để hiểu, không cần hiệu ứng.
- Muốn **gợi ý từng bước**, **không muốn bị đưa đáp án ngay**.
- Hay học **ban đêm**, mỗi buổi 25–45 phút.

---

## 1. Ngôn ngữ nội dung (bắt buộc)

- **Tiếng Anh nhiều hơn** (cập nhật 2026-11): toàn bộ **UI, category, tên chương, heading, nhãn bước** ("Step 1", "Check"), đề bài tập viết bằng tiếng Anh.
- **Tiếng Việt** cho phần **lý thuyết**: giải thích, trực giác, gợi ý, lời giải.
- **Tiếng Anh** cho: thuật ngữ (giữ nguyên, không dịch gượng), định nghĩa formal, định lý, tên thuật toán, và những từ/câu mà dịch ra sẽ mất nghĩa.
- Lần đầu xuất hiện, thuật ngữ được chú thích ngắn: *"negligible function (hàm không đáng kể)"*.
- Câu tiếng Anh viết **đơn giản**, câu ngắn, tránh từ hiếm (khoảng IELTS 6.5).
- Ví dụ một đoạn chuẩn:
  > **Definition (Group).** A group is a set G with an operation · that satisfies closure, associativity, identity, and inverse.
  > Nói đơn giản: một tập hợp mà "cộng/nhân" trong đó không bao giờ văng ra ngoài, có phần tử trung hòa, và phần tử nào cũng "hoàn tác" được.

---

## 2. Nguyên tắc thiết kế bài học

Mỗi lesson là một trang lý thuyết ngắn, đọc dễ, theo đúng thứ tự:

1. **Vì sao cần học** (2–3 câu, nối với nghiên cứu: "PLONK cần cái này để...").
2. **Trực giác** (tiếng Việt, có ví dụ số cụ thể, nhỏ, tính tay được).
3. **Định nghĩa / Định lý formal** (tiếng Anh, KaTeX).
4. **Worked example** (ví dụ giải mẫu từng bước, mỗi bước có giải thích vì sao).
5. **Lỗi hay gặp** (2–3 hiểu lầm phổ biến).
6. **Bài tập** (mục 3), đây là phần chính.
7. **Tóm tắt** (3–5 gạch đầu dòng) + **flashcard** tự động vào hàng ôn tập.

**Luật:**
- Mỗi lesson đọc xong trong **≤ 10 phút** (không tính bài tập). Chủ đề lớn thì chia nhỏ.
- Chỉ có minh họa khi **thật sự giúp hiểu hơn chữ** (ví dụ: cộng điểm trên elliptic curve, attention matrix, Bloch sphere). Minh họa đơn giản, đen trắng/xám, có thể có một màu nhấn. **Không** animation trang trí, không gamification phô trương.
- Mỗi concept có trường `researchBridge`: nối với hướng nghiên cứu (ZKP benchmarking, cross-chain protocol, TrustCircuit, Solidity security...).

---

## 3. Bài tập toán (phần quan trọng nhất)

### 3.1 Ba cấp độ, lesson nào cũng có đủ
| Cấp | Mục đích | Ví dụ |
|---|---|---|
| **A — Tính toán** | Làm quen, tính tay | "Tính 3⁻¹ mod 7", "Cộng P + Q trên y² = x³ + 2x + 3 mod 97" |
| **B — Hiểu bản chất** | Áp dụng, giải thích vì sao | "Vì sao Z₆ với phép nhân không phải là group?", "Nếu bỏ binding thì commitment bị tấn công thế nào?" |
| **C — Chứng minh** | Rèn tư duy formal | "Chứng minh mọi group cấp nguyên tố đều cyclic", "Chứng minh Schnorr protocol là special sound" |

Mỗi lesson: **4–6 bài cấp A, 2–4 bài cấp B, 1–2 bài cấp C**.

### 3.2 Dạng bài
- `numeric`: nhập số, so sánh tự động (hỗ trợ "mod p", phân số, nhiều đáp án đúng).
- `expression`: nhập biểu thức/đa thức, kiểm tra tương đương bằng cách thử giá trị ngẫu nhiên.
- `multiple-choice` / `true-false-why`: chọn đúng/sai **và** chọn lý do.
- `step-fill`: lời giải có sẵn khung, người học điền các bước còn trống.
- `proof-order`: các bước chứng minh bị xáo trộn, người học sắp xếp lại.
- `proof-write`: tự viết chứng minh vào ô text (hỗ trợ KaTeX). App hiển thị **checklist các ý bắt buộc phải có** để người học tự chấm; nếu bật AI Tutor thì tutor nhận xét (mục 9).
- `code-python`: viết code numpy, chạy bằng Pyodide, có test.
- `code-rust`: trỏ tới một kata trong `rust-katas/`.

### 3.3 Hint ladder (bắt buộc cho mọi bài)
1. **Gợi ý hướng**: "Nghĩ tới định nghĩa nghịch đảo."
2. **Gợi ý công cụ / công thức**: "Dùng Extended Euclid."
3. **Gợi ý bước đầu**: "Viết 7 = 2·3 + 1."
4. **Lời giải đầy đủ**: chỉ mở khi người học bấm "Tôi đã thử rồi" và xác nhận lần nữa.

App ghi lại số hint đã dùng; bài phải dùng tới bậc 3–4 thì tự động đưa lại vào hàng ôn sau vài ngày (với số liệu khác nếu là bài sinh tự động).

### 3.4 Bài sinh tự động
Bài cấp A cho các chủ đề tính toán (mod arithmetic, inverse, CRT, EC add, Lagrange, matrix, xác suất...) có **generator** sinh số ngẫu nhiên kèm đáp án, để luyện vô hạn. Generator phải có unit test.

### 3.5 Bộ bài tổng hợp
- **Problem set cuối chương**: 10–15 bài trộn mọi lesson trong chương, độ khó tăng dần.
- **Mixed review hàng tuần**: trộn bài từ nhiều chương đã học, để không quên.

---

## 4. Tech stack

| Phần | Chọn |
|---|---|
| Framework | React 18 + Vite + TypeScript (strict) |
| Style | Tailwind, **giao diện tối giản**: font đọc dễ (serif cho thân bài hoặc Inter), cỡ chữ lớn, độ rộng dòng ~70 ký tự, **dark mode mặc định**, màu chủ đạo xám + một màu nhấn |
| Router / State | React Router, Zustand |
| Lưu trữ | IndexedDB (Dexie). Không login, không cloud DB |
| Toán | KaTeX |
| Minh họa (chỉ khi cần) | SVG/D3 đơn giản; Three.js chỉ cho Bloch sphere |
| Python trong browser | Pyodide (numpy) |
| Rust | Chạy qua dev server local (mục 7) |
| Spaced repetition | FSRS (`ts-fsrs`) |
| Content | MDX + JSON trong `content/` |
| Test | Vitest + Playwright (smoke test) |

---

## 5. Cấu trúc thư mục

```
forge-lab/
├─ content/
│  ├─ tracks.json            # danh sách track + thứ tự
│  ├─ graph.json             # concept → prerequisites
│  ├─ glossary.json          # thuật ngữ EN → giải thích VN
│  ├─ math/ crypto-zk/ rust/ ml/ syssec/ trends/ quantum/
│  │   └─ <lesson-id>.mdx
│  └─ exercises/<track>/<lesson-id>.json
├─ rust-katas/               # cargo workspace, mỗi kata một crate có tests
├─ server/                   # Node server nhỏ chạy cargo test (127.0.0.1)
├─ src/
│  ├─ app/  engine/  exercises/  generators/  widgets/  runners/  tutor/  db/
└─ SPEC.md
```

---

## 6. Data schema

### 6.1 Lesson (frontmatter MDX)
```yaml
id: math.field.mod-arith
track: math
chapter: number-theory
title: "Modular arithmetic — số học đồng dư"
minutes: 8
prerequisites: [math.basics.divisibility]
researchBridge: "Mọi phép tính trong Groth16/PLONK đều chạy trong F_p."
flashcards:
  - front: "a ≡ b (mod n) nghĩa là gì?"
    back: "n chia hết (a − b)."
```
Component trong MDX: `<Why>`, `<Intuition>`, `<Definition>`, `<Theorem>`, `<Proof>` (thu gọn được), `<Example>`, `<Pitfalls>`, `<Exercises />`, `<Summary>`, `<Term en="...">` (hover hiện giải thích tiếng Việt từ glossary).

### 6.2 Exercise (JSON)
```json
{
  "id": "math.field.inverse-01",
  "level": "A",
  "type": "numeric",
  "prompt": "Tìm nghịch đảo của 3 trong F_7.",
  "answer": "5",
  "hints": [
    "Nghịch đảo x thỏa 3·x ≡ 1 (mod 7).",
    "Dùng Extended Euclid, hoặc thử x = 1..6.",
    "Viết 7 = 2·3 + 1, suy ra 1 = 7 − 2·3."
  ],
  "solution": "1 = 7 − 2·3 ⇒ −2·3 ≡ 1 ⇒ x ≡ −2 ≡ 5 (mod 7). Kiểm tra: 3·5 = 15 ≡ 1.",
  "generator": "modInverse"
}
```
Bài `proof-write` thêm trường `rubric`: danh sách ý bắt buộc (ví dụ: "Nêu rõ giả thiết |G| = p", "Dùng định lý Lagrange", "Kết luận phần tử ≠ e sinh ra G").

### 6.3 IndexedDB stores
`progress`, `attempts` (exerciseId, correct, hintsUsed, ts), `cards` (FSRS), `notes`, `settings`.

---

## 7. Rust runner
- `server/` chỉ bind `127.0.0.1`. `POST /api/rust/run { kata, code }`: chép kata sang thư mục tạm, ghi code, chạy `cargo test --quiet`, trả về kết quả từng test.
- Editor: CodeMirror 6.
- Máy chưa có `cargo` thì hiện hướng dẫn cài `rustup`; phần còn lại của app vẫn chạy bình thường.

---

## 8. Nội dung các track

> Mỗi gạch đầu dòng ≈ 1–3 lesson. Track nào cũng có bài tập theo mục 3. **(minh họa)** = có hình minh họa đơn giản.

### 8.1 Math Foundations
- **Logic & proof techniques** (học đầu tiên): mệnh đề, lượng từ, chứng minh trực tiếp, phản chứng, quy nạp, phản ví dụ. Rất nhiều bài `proof-order` và `step-fill`.
- **Number theory**: chia hết, gcd, Extended Euclid, modular arithmetic, Fermat nhỏ, Euler, CRT.
- **Abstract algebra**: group, subgroup, định lý Lagrange, cyclic group & generator, homomorphism, ring, field, finite field F_p và F_{p^k}.
- **Polynomials**: phép chia, nghiệm, Lagrange interpolation **(minh họa)**, polynomial trên F_p, Schwartz–Zippel lemma.
- **Elliptic curves**: trên số thực **(minh họa)**, trên F_p, scalar multiplication, discrete log, pairing (trực giác + tính chất bilinear).
- **FFT / NTT**: roots of unity, vì sao nhanh.
- **Probability**: xác suất có điều kiện, kỳ vọng, birthday bound, union bound, negligible function.
- **Linear algebra**: vector, matrix, hệ phương trình, rank, eigen, SVD (đủ cho ML và R1CS).
- **Calculus cho ML**: đạo hàm, gradient, chain rule, tối ưu cơ bản.
- **Statistics cho experiment**: mean/variance, confidence interval, hypothesis test cơ bản, cách benchmark đúng (warm-up, số lần lặp, median + CI, outlier).

### 8.2 Crypto & Zero-Knowledge
- **Provable security**: định nghĩa bằng game (IND-CPA, EUF-CMA), advantage, reduction, hybrid argument, random oracle model, Fiat–Shamir.
- **Hash, MAC, signature, encryption**: định nghĩa formal + ví dụ.
- **Commitments**: hiding/binding, Pedersen.
- **Interactive proofs**: completeness, soundness, zero-knowledge, Schnorr protocol, special soundness, simulator.
- **Arithmetization**: circuit → R1CS → QAP; Plonkish.
- **Sumcheck**, polynomial commitment, KZG, FRI (trực giác), so sánh Groth16 / PLONK / STARK / Bulletproofs.
- **Bug thực tế**: under-constrained circuit, Fiat–Shamir yếu (Frozen Heart).
- **Formal verification protocol**: ProVerif/Tamarin (cài đặt, chạy model mẫu, đọc attack trace).

### 8.3 Rust
- Ownership / borrowing, lifetimes, traits & generics, error handling, iterators, testing, benchmarking (`criterion`).
- Kata nối thành dự án: `FieldElement<P>` → polynomial + Lagrange → EC point add/scalar mul → Pedersen → Schnorr → toy sumcheck. Cuối track đọc `arkworks` để so với bản tự viết.

### 8.4 ML / Deep Learning (lý thuyết + numpy from scratch)
- Linear / logistic regression, loss, gradient descent.
- Neural network, backpropagation (có bài tự tính gradient bằng tay).
- Optimizers (SGD, momentum, Adam), regularization, overfitting, đánh giá model đúng cách, data leakage.
- CNN, RNN (ngắn), **Transformer**: embedding, attention **(minh họa)**, positional encoding, tự viết mini attention bằng numpy.
- Generative models (trực giác): VAE, diffusion, LLM pretraining & fine-tuning.

### 8.5 Systems Security — kiến thức nền để đọc paper USENIX Security (track mới)

**Mục tiêu:** đọc một paper USENIX Security bất kỳ mà hiểu được nó giải bài toán gì, dựa trên kiến thức gì, và đóng góp nằm ở đâu.

**Chương 0 — Cách đọc paper systems security**
- Cấu trúc điển hình: threat model → design → implementation → evaluation → limitations → ethics.
- Các loại paper: attack, defense, measurement study, SoK (Systematization of Knowledge), replication.
- Cách đọc 3 lượt (đọc lướt → đọc hiểu → đọc phản biện) và mẫu ghi chú: *Problem / Threat model / Key idea / Evaluation / Weakness*.

**Các chương kiến thức** (mỗi chương: lý thuyết nền + "đọc hiểu một paper mẫu" + bài tập):
1. **Memory safety & exploitation**: stack/heap, buffer overflow, use-after-free, ROP, các cơ chế phòng thủ (ASLR, DEP, stack canary, CFI), vì sao Rust giúp được.
2. **Fuzzing**: coverage-guided fuzzing, AFL/libFuzzer, sanitizers, directed fuzzing, fuzzing smart contract.
3. **Program analysis**: static vs dynamic analysis, taint analysis, symbolic execution, SMT solver (trực giác), binary analysis & decompilation.
4. **OS & kernel security**: privilege, syscall, sandboxing, isolation, container security.
5. **Hardware & TEE**: SGX, TrustZone, AMD SEV, AWS Nitro Enclaves (nối với TrustCircuit), remote attestation, side channel (cache timing, Spectre/Meltdown, Rowhammer — ở mức khái niệm).
6. **Web & browser security**: same-origin policy, XSS, CSRF, CSP, browser sandbox.
7. **Network security**: TLS, DNS security, DDoS, censorship & anonymity (Tor).
8. **Authentication & usable security**: password, MFA, passkeys/WebAuthn, phishing.
9. **Privacy**: differential privacy (có bài tập toán: ε, sensitivity, Laplace mechanism), anonymization và re-identification, tracking.
10. **Security & privacy of ML**: adversarial examples, data poisoning, backdoor, membership inference, model extraction, prompt injection & LLM agent security.
11. **Blockchain & smart contract security**: reentrancy, MEV/front-running, oracle manipulation, bridge attack, upgrade bug (nối với các paper của người học).

**Paper Decoder** (tính năng riêng cho track này): người học nhập tên một paper hoặc dán abstract → app gợi ý **những lesson nào cần học trước** dựa trên từ khóa trong `glossary.json` và `graph.json`. Bản offline chỉ cần so khớp từ khóa; nếu bật AI Tutor thì tutor phân tích sâu hơn. **Không** tự bịa nội dung paper.

### 8.6 AI Trends
- Mỗi trend là một trang ngắn: là gì, ý tưởng cốt lõi, liên quan gì tới security/blockchain, nguồn gốc nên đọc.
- Nhóm ban đầu: LLM & scaling, RL cho reasoning, AI agents & tool use, diffusion, mechanistic interpretability, AI safety, ZKML, FHE/MPC cho ML, LLM cho smart-contract auditing.
- File `content/trends/_meta.json` có `lastReviewed` và `verified` cho từng trang. Trang quá 6 tháng hiện nhãn "cần cập nhật". **Không được bịa số liệu hay tên paper**; nguồn nào chưa kiểm chứng thì để `verified: false`.

### 8.7 Quantum Computing
- Nền toán trước: số phức, vector trạng thái, tensor product, unitary matrix (có bài tập tính tay).
- Qubit, superposition, measurement, Bloch sphere **(minh họa)**.
- Gates và circuit (X, H, Z, CNOT, phase), simulator statevector tối đa 5 qubit viết bằng TypeScript, có unit test.
- Entanglement, Bell state, no-cloning.
- Thuật toán: Deutsch–Jozsa, Grover, QFT, Shor (period finding → phá RSA/ECC).
- **Nối với crypto**: post-quantum crypto (lattice, LWE, hash-based signature); ZK nào được xem là post-quantum (STARK) và cái nào không (Groth16/KZG).

---

## 9. AI Tutor (tùy chọn, tắt mặc định)
- Người dùng tự nhập API key; key chỉ lưu trong IndexedDB local, không log, không gửi đi đâu khác.
- **Socratic mode mặc định**: chỉ gợi ý và hỏi ngược, **không đưa đáp án** khi người học chưa mở bậc lời giải.
- Chức năng: "Giải thích đơn giản hơn", "Cho thêm ví dụ", **"Chấm chứng minh của tôi"** (so với `rubric`, chỉ ra ý thiếu hoặc bước sai, **không viết lại giùm**).
- Tutor trả lời theo tỉ lệ ngôn ngữ ở mục 1.
- App phải dùng đầy đủ được khi **không có** tutor.

---

## 10. Màn hình & chất lượng

**Màn hình:** Home "Tối nay" (thẻ ôn tới hạn + lesson tiếp theo + bài tập cần làm lại) · Mục lục theo track/chương · Lesson · Bài tập · Ôn tập flashcard · Problem set · Glossary · Ghi chú (xuất Markdown) · Settings (tutor, cỡ chữ, export/import JSON).

**Chất lượng:**
- Mọi generator và mọi đáp án tính toán có **unit test**. Toán sai còn tệ hơn không học.
- Mọi lời giải mẫu trong content phải được kiểm lại bằng code nếu tính được (script `npm run verify-content`).
- Phím tắt: `Enter` nộp bài, `H` mở hint, `1–4` đánh giá flashcard.
- Thêm bài mới **chỉ cần thêm file trong `content/`**, không phải sửa code.

---

## 11. Milestones

| # | Mục tiêu | Xong khi |
|---|---|---|
| **M1** | Khung app tối giản, MDX loader + các component lý thuyết, glossary hover, IndexedDB, flashcard FSRS | Đọc được 3 lesson mẫu (logic, mod arithmetic, Euclid), flashcard vào hàng ôn |
| **M2** | **Exercise engine** đầy đủ dạng bài (mục 3.2) + hint ladder + generator + problem set | 3 lesson mẫu có đủ bài cấp A/B/C, bài sinh tự động chạy, test pass |
| **M3** | Nội dung Math (logic → elliptic curve → probability → linear algebra → statistics) | Đủ lesson + bài tập; `verify-content` pass |
| **M4** | Track Crypto/ZK | Từ provable security tới sumcheck/KZG, có bài chứng minh với rubric |
| **M5** | Track Systems Security (chương 0 + 11 chương) + Paper Decoder offline | Mỗi chương có lý thuyết, một phần "đọc hiểu paper mẫu" và bài tập |
| **M6** | Rust runner + 6 kata | `cargo test` chạy từ trong app |
| **M7** | Pyodide + track ML/DL | Viết và chạy mini attention bằng numpy |
| **M8** | Quantum + AI Trends | Simulator có test; trang trends có `lastReviewed`/`verified` |
| **M9** | AI Tutor (optional) | Socratic mode + chấm chứng minh theo rubric |

**Làm việc với Claude Code:** mỗi lần giao **một milestone**. Cuối milestone: chạy test, liệt kê đã làm gì và còn thiếu gì, rồi mới qua milestone tiếp.

---

## 12. Ngoài phạm vi
- Không login, không backend cloud, không analytics.
- Không chép nguyên văn sách hay paper. Chỉ viết giải thích riêng và dẫn nguồn.
- Không hiệu ứng trang trí, không gamification phô trương.
- Ưu tiên chiều sâu **Math + Crypto/ZK + Systems Security** trước; các track khác mở rộng dần.
