🌍 EcoLedger

EcoLedger is a sustainability tracker that uses real-time data and blockchain transparency to make eco-friendly actions engaging, measurable, and trustworthy.

Users can log sustainable activities, earn points, view leaderboards in real time, export reports, and track their progress toward personal and community goals. With blockchain integration, EcoLedger ensures transparency, accessibility, and trust in sustainability data.

✨ Features

🔐 User Authentication (Supabase) – secure login/logout

📊 Dashboard – view logged activities, CO₂ savings, and points

🏆 Real-Time Leaderboard – instantly updated using Supabase realtime

📑 Reports – export sustainability actions as CSV

🎯 Goals Tracking – set and monitor eco goals with progress bars

👤 Profile Page – manage user details and logout securely

⛓ Blockchain Placeholder – future integration for transparent carbon data & eco-credit tokenization

🛠 Tech Stack

Frontend: React + TailwindCSS

Backend / Realtime: Supabase (Postgres + Auth + Realtime)

Deployment: Lovable (with environment variables configured)

Blockchain: Placeholder integration for transparent sustainability data

🚀 Getting Started

Clone the repo and set up locally:

git clone https://github.com/your-username/ecoledger.git
cd ecoledger
npm install


Create a .env file based on the provided .env.example:

cp .env.example .env


Fill in your Supabase project keys:

NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key


Run locally:

npm run dev


The app will be available at http://localhost:3000.

📂 Project Structure
EcoLedger/
 ├── components/       # Reusable UI components
 ├── pages/            # Main routes (Dashboard, Reports, Profile, etc.)
 ├── utils/            # Helper functions (CSV export, Supabase client)
 ├── public/           # Assets
 ├── .env.example      # Example environment variables
 ├── README.md         # Project documentation

📹 Demo Video

[🔗 Add your video link here (YouTube unlisted or Loom)]

The video (max 4 minutes) walks through:

Logging in

Adding eco activities

Viewing real-time leaderboard updates

Exporting reports

Blockchain transparency explanation

🌱 Theme Connection

Transparency & Trust: Blockchain integration ensures sustainability data cannot be altered, providing confidence to communities and organizations.

Accessibility: Users can track and share progress easily with real-time updates.

Sustainability: EcoLedger motivates individuals and groups to adopt eco-friendly behaviors while making the impact measurable.

👥 Team

Developer: Linford Musiyambodza – Founder, Linfy Tech Solutions

🌐 Website: linfordlee14.github.io/linford-musiyambodza-portfolio

💼 LinkedIn: linkedin.com/in/linfordlee14

📧 Email: linfordlee14@gmail.com

📜 License

This project is open-source under the MIT License