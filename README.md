# Lock In

A social accountability product that helps students follow through on difficult tasks by putting credits at stake and asking a trusted peer to verify completion.

[Live demo](https://lock-in-delta-coral.vercel.app)

## Product outcome

- Co-built **two full-stack MVPs** around task verification and peer feedback.
- Validated the core workflow through usability testing with **45+ university students**.
- Combined financial stakes, proof submission, and peer verification to help students tackle procrastination.

## Core flow

1. Create a task and choose how many Lock In credits to stake.
2. Select a friend as the verifier.
3. Submit proof before the deadline.
4. The verifier approves or rejects the proof.
5. Completed tasks return the stake and reinforce accountability.

## My contribution

This was a team project. I contributed to the product requirements, full-stack MVPs, and team usability testing. The repository preserves the shared implementation and product artifacts; commit history and contributors provide the detailed ownership record.

## Architecture

- **Frontend:** Next.js, TypeScript, React, Tailwind CSS
- **Backend:** FastAPI and Python
- **Data and authentication:** Supabase
- **Deployment:** Vercel and Railway
- **Notifications:** Resend and scheduled backend jobs

## Run locally

```bash
git clone https://github.com/rithanisk/lock-in.git
cd lock-in
```

Create environment files for the frontend and backend using your own Supabase and Resend credentials. Then run each service:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

```bash
cd frontend
npm install
npm run dev
```

## Limitations

- The current product was validated with university students; broader retention and long-term behavior change remain unproven.
- Credits are an in-product accountability mechanism, not real currency or a financial product.

