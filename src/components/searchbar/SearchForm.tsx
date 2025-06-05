"use client";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { useRef, useState } from "react";

interface SearchFormProps {
  onSearch: (query: string) => Promise<void>;
  isLoading: boolean;
}

export const SearchForm = ({ onSearch, isLoading }: SearchFormProps) => {
  const [prompt, setPrompt] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    await onSearch(prompt);
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex items-center gap-2 w-full"
    >
      <Input
        ref={inputRef}
        type="text"
        placeholder="Entrez une citation de film..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="w-full"
        disabled={isLoading}
      />
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Recherche..." : "Rechercher"}
      </Button>
    </form>
  );
};
