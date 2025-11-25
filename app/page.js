"use client";

import { useState, useEffect } from "react";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], weight: ["400", "600", "700"] });
const SCORE_LEVELS = [
  { min: 0, max: 1, label: "Level – Ritual Newbie" },
  { min: 2, max: 3, label: "Level – Curious Explorer" },
  { min: 4, max: 5, label: "Level – Knowledge Seeker" },
  { min: 6, max: 6, label: "Level – Ritual Initiate" },
  { min: 7, max: 7, label: "Level – System Understander" },
  { min: 8, max: 8, label: "Level – Protocol Thinker" },
  { min: 9, max: 9, label: "Level – Ritual Architect" },
  { min: 10, max: 10, label: "Level – AI Infrastructure Master" },
];

const getScoreMeaning = (score) => {
  return SCORE_LEVELS.find(
    (level) => score >= level.min && score <= level.max
  )?.label;
};
const ritualMCQQuestions = [
  {
    question: "What problem does Ritual aim to solve?",
    options: [
      "High GPU costs",
      "Flawed centralized AI infrastructure",
      "Gaming latency issues",
      "Low NFT adoption",
    ],
    answer: "Flawed centralized AI infrastructure",
  },
  {
    question: "Ritual is best described as?",
    options: [
      "A centralized AI company",
      "A decentralized open AI infrastructure network",
      "A GPU provider",
      "A cloud storage platform",
    ],
    answer: "A decentralized open AI infrastructure network",
  },
  {
    question: "Which value is part of Ritual’s core philosophy?",
    options: [
      "Closed-source governance",
      "Censorship resistance",
      "AI monetization only",
      "High transaction fees",
    ],
    answer: "Censorship resistance",
  },
  {
    question: "What does the Ritual SDK help developers with?",
    options: [
      "NFT minting",
      "Easy decentralized AI integration",
      "Video rendering",
      "Game development",
    ],
    answer: "Easy decentralized AI integration",
  },
  {
    question: "What is EVM++ in the Ritual ecosystem?",
    options: [
      "A new smart contract language",
      "Enhanced EVM with native heterogeneous compute",
      "A crypto wallet",
      "A staking protocol",
    ],
    answer: "Enhanced EVM with native heterogeneous compute",
  },
  {
    question: "What is Infernet?",
    options: [
      "A centralized AI tool",
      "A decentralized oracle for heterogeneous compute",
      "A DeFi protocol",
      "A blockchain explorer",
    ],
    answer: "A decentralized oracle for heterogeneous compute",
  },
  {
    question: "What feature ensures AI results on Ritual are trustworthy?",
    options: [
      "Random sampling",
      "Fully verifiable computation",
      "Faster internet",
      "Private servers",
    ],
    answer: "Fully verifiable computation",
  },
  {
    question: "What is the role of Resonance?",
    options: [
      "Consensus algorithm",
      "Fee market for heterogeneous compute",
      "Security layer",
      "NFT trading system",
    ],
    answer: "Fee market for heterogeneous compute",
  },
  {
    question: "Who is a co-founder of Ritual?",
    options: [
      "Arthur Hayes",
      "Niraj Pant",
      "Illia Polosukhin",
      "Sreeram Kannan",
    ],
    answer: "Niraj Pant",
  },
  {
    question: "What is Shrine in Ritual?",
    options: [
      "A religious DAO",
      "An AI NFT platform",
      "An incubator for AI + crypto builders",
      "A blockchain explorer",
    ],
    answer: "An incubator for AI + crypto builders",
  },
];

export default function Page() {
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState("");
  const [questions, setQuestions] = useState([]);
  const [quizKey, setQuizKey] = useState(0);
  const [disableOptions, setDisableOptions] = useState(false);
 const scoreMeaning = getScoreMeaning(score); 
  const shuffleArray = (array) =>
    array
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);

  useEffect(() => {
    const shuffledQuestions = shuffleArray(ritualMCQQuestions).map((q) => ({
      ...q,
      options: shuffleArray(q.options),
    }));
    setQuestions(shuffledQuestions);
  }, [quizKey]);

  const handleSelect = (option) => {
    if (disableOptions) return;
    setSelectedOption(option);
    setDisableOptions(true);

    if (option === questions[currentIndex].answer) {
      setScore((prev) => prev + 1);
    }

    setTimeout(() => {
      setSelectedOption("");
      setDisableOptions(false);
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setFinished(true);
      }
    }, 600);
  };

  const handleRestart = () => {
    setScore(0);
    setCurrentIndex(0);
    setFinished(false);
    setQuizKey((prev) => prev + 1);
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-between ${inter.className}
      bg-gradient-to-br from-[#f8fafc] to-[#eef2ff] text-[#1e293b]`}
    >
      {/* Header */}
      <header className="
  sticky top-6 mx-auto w-[92%] max-w-lg 
  bg-white/90 backdrop-blur-md 
  border border-[#e2e8f0] 
  rounded-2xl py-3 px-4 
  shadow-sm z-20
">
  <div className="flex items-center justify-center gap-3">
    
    {/* Ritual Logo */}
    <svg
      width="32"
      height="32"
      viewBox="0 0 33 33"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13.1047 26.7745L14.6029 25.2665L15.3981 26.0669L12.75 28.7322L8.20482 24.1574L14.6029 17.7176L15.3981 18.518L10.1453 23.805L9.79515 24.1574L10.1453 24.5098L12.3953 26.7745L12.75 27.1315L13.1047 26.7745ZM13.8519 22.2925L14.647 21.4922L19.8952 26.7746L20.2499 27.1316L20.6046 26.7746L22.8546 24.51L23.2047 24.1576L22.8546 23.8052L21.3518 22.2926L22.147 21.4921L24.7952 24.1575L20.25 28.7322L13.8519 22.2925ZM20.2506 4.48439L24.7958 9.05914L18.3977 15.4989L17.6025 14.6986L22.8553 9.41158L23.2055 9.05917L22.8553 8.70677L20.6053 6.44212L20.2506 6.08512L19.8959 6.44212L18.3977 7.95012L17.6025 7.14979L20.2506 4.48439ZM22.1471 13.9433L27.3953 19.2257L27.75 19.5827L28.1047 19.2257L30.3547 16.9611L30.7049 16.6087L30.3547 16.2563L28.1047 13.9916L27.75 13.6346L27.3953 13.9916L25.8971 15.4996L25.1019 14.6993L27.75 12.0339L32.2952 16.6087L27.75 21.1834L21.3519 14.7437L22.1471 13.9433ZM5.60467 19.2257L7.10291 17.7177L7.89812 18.518L5.25 21.1834L0.704823 16.6086L5.24994 12.0339L11.6481 18.4736L10.8529 19.274L5.60467 13.9916L5.24997 13.6346L4.89527 13.9916L2.64527 16.2562L2.29515 16.6086L2.64527 16.961L4.89527 19.2257L5.24997 19.5827L5.60467 19.2257ZM12.75 4.48505L19.1481 10.9248L18.3529 11.7252L13.1047 6.44279L12.75 6.08578L12.3953 6.44279L10.1453 8.70743L9.79515 9.05984L10.1453 9.41224L11.6481 10.9248L10.8529 11.7252L8.20482 9.05981L12.75 4.48505ZM15.3981 10.9692L10.897 15.4996L10.1019 14.6993L14.6029 10.1689L15.3981 10.9692ZM18.353 19.274L13.8519 14.7436L14.647 13.9433L19.1481 18.4737L18.353 19.274ZM17.6018 22.248L22.1029 17.7177L22.8981 18.5181L18.397 23.0484L17.6018 22.248ZM16.5295 4.7672L14.5137 2.73831L16.5295 0.709411L18.5453 2.73831L16.5295 4.7672ZM16.5295 32.2906L14.5138 30.2617L16.5295 28.2328L18.5453 30.2617L16.5295 32.2906Z"
        fill="#312e81"
        stroke="#312e81"
      />
    </svg>

    {/* Title */}
    <div>
      <h1 className="text-xl font-bold text-[#312e81]">
        Ritual Knowledge Quiz
      </h1>
      <p className="text-[11px] text-[#64748b]">
        Decentralized AI Infrastructure
      </p>
    </div>
  </div>
</header>


      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 mt-24 mb-20">
        {!started ? (
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-lg border border-[#e2e8f0] text-center">
            <h2 className="text-xl font-semibold text-[#1e293b] mb-2">
              Welcome to the Ritual Quiz
            </h2>
            <p className="text-[#64748b] text-sm mb-6">
              Test your understanding of decentralized AI built on Ritual.
            </p>

            <button
              onClick={() => setStarted(true)}
              className="px-6 py-2 rounded-full bg-[#4f46e5] text-white hover:opacity-90 transition font-medium"
            >
              Start Quiz
            </button>
          </div>
        ) : !finished ? (
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-lg border border-[#e2e8f0]">
            {/* Progress */}
            <div className="w-full bg-[#e2e8f0] rounded-full h-2 mb-6">
              <div
                className="bg-[#4f46e5] h-2 rounded-full transition-all duration-700"
                style={{
                  width: `${((currentIndex + 1) / questions.length) * 100}%`,
                }}
              />
            </div>

            <h2 className="text-sm text-[#64748b] text-center mb-2">
              Question {currentIndex + 1} of {questions.length}
            </h2>

            <p className="text-center text-[#1e293b] mb-6 font-medium">
              {questions[currentIndex]?.question}
            </p>

            <div className="space-y-3">
              {questions[currentIndex]?.options.map((option, idx) => {
                let style = "bg-[#f8fafc] text-[#1e293b] border-[#e2e8f0]";

                if (selectedOption) {
                  if (option === questions[currentIndex].answer) {
                    style = "bg-green-500 text-white border-green-500";
                  } else if (
                    option === selectedOption &&
                    option !== questions[currentIndex].answer
                  ) {
                    style = "bg-red-400 text-white border-red-400";
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(option)}
                    disabled={disableOptions}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-300 hover:scale-[1.02] ${style}`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
         <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-lg border text-center">
            <h2 className="text-xl font-bold mb-2">Quiz Completed</h2>

            <p className="mb-1">
              Your Score:{" "}
              <span className="font-bold text-[#4f46e5]">
                {score}/{questions.length}
              </span>
            </p>

            {/* ✅ Score Meaning Added */}
            <p className="text-sm font-semibold text-[#312e81] mt-2">
              {scoreMeaning}
            </p>

            <p className="text-xs text-[#64748b] mb-6 mt-1">
              The future of open AI is decentralized.
            </p>

            <button
              onClick={handleRestart}
              className="px-6 py-2 rounded-full bg-[#4f46e5] text-white"
            >
              Restart Quiz
            </button>
          </div>
        )}
      </main>


      {/* Footer */}
      <footer className="fixed bottom-0 w-full py-3 text-center text-xs text-[#64748b] bg-white border-t border-[#e2e8f0]">
        © {new Date().getFullYear()} Ritual Quiz -  Built by Maharshi
      </footer>
    </div>
  );
}
