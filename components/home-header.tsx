"use client";
import { TypeAnimation } from "react-type-animation";

export function HomeHeader() {
  const wordPool = [
    "hanging",
    "partying",
    "playing",
    "relaxing",
    "fishing",
    "bowling",
    "golfing",
    "shopping",
    "gardening",
    "hiking",
    "camping",
    "skating",
    "painting",
    "dancing",
    "singing",
    "biking",
    "gaming",
    "baking",
    "climbing",
    "exploring",
    "traveling",
    "bonding",
    "celebrating",
    "loving",
    "connecting",
    "discovering",
    "experiencing",
    "enjoying",
    "learning",
    "living",
  ];
  const generateSequence = () => {
    let sequence = [];
    let wordPoolCopy = [...wordPool]; // Create a copy of endPool to shuffle

    // Shuffle the endPoolCopy array
    for (let i = wordPoolCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [wordPoolCopy[i], wordPoolCopy[j]] = [wordPoolCopy[j], wordPoolCopy[i]];
    }

    for (let i = 0; i < wordPoolCopy.length; i++) {
      sequence.push(wordPoolCopy[i] + ".");
      sequence.push(2000);
    }

    return sequence;
  };
  return (
    <div className="flex flex-col">
      <span className="text-5xl md:text-6xl font-heading">
        Spend less time planning and more time{" "}
      </span>
      <TypeAnimation
        preRenderFirstString={true}
        sequence={generateSequence()}
        speed={50}
        className="text-5xl md:text-6xl font-heading text-primary"
        repeat={Infinity}
      />
    </div>
  );
}
