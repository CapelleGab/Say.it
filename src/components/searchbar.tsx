"use client";

import { Input } from "@/src/components/ui/input";
import { useState } from "react";
import { Button } from "./ui/button";
import { ModeToggle } from "./ui/toggle-theme";

export const SearchBar = () => {
  const [prompt, setPrompt] = useState("");

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(prompt);
  };

  return (
    <div className="flex items-center gap-2 w-full max-w-2xl mx-auto bg-background/50 backdrop-blur-sm border border-border/50 p-4 rounded-2xl">
      <ModeToggle />
      <form
        onSubmit={handleSearch}
        className="flex items-center gap-2 w-full max-w-2xl mx-auto"
      >
        <Input
          type="text"
          placeholder="Enter your prompt here..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full"
        />
        <Button type="submit">Search</Button>
      </form>
    </div>
  );
};
