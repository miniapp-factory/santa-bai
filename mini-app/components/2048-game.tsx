"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { Share } from "@/components/share";
import { url } from "@/lib/metadata";

const GRID_SIZE = 4;
const TARGET = 2048;

function emptyBoard(): number[][] {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
}

function addRandomTile(board: number[][]): number[][] {
  const empty: [number, number][] = [];
  board.forEach((row, r) =>
    row.forEach((cell, c) => {
      if (cell === 0) empty.push([r, c]);
    })
  );
  if (empty.length === 0) return board;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  const newBoard = board.map((row) => row.slice());
  newBoard[r][c] = value;
  return newBoard;
}

function transpose(board: number[][]): number[][] {
  return board[0].map((_, i) => board.map((row) => row[i]));
}

function reverseRows(board: number[][]): number[][] {
  return board.map((row) => row.slice().reverse());
}

function compress(row: number[]): number[] {
  const newRow = row.filter((v) => v !== 0);
  while (newRow.length < GRID_SIZE) newRow.push(0);
  return newRow;
}

function merge(row: number[]): { merged: number[]; score: number } {
  const newRow = row.slice();
  let score = 0;
  for (let i = 0; i < GRID_SIZE - 1; i++) {
    if (newRow[i] !== 0 && newRow[i] === newRow[i + 1]) {
      newRow[i] *= 2;
      newRow[i + 1] = 0;
      score += newRow[i];
    }
  }
  return { merged: compress(newRow), score };
}

function move(board: number[][], dir: "up" | "down" | "left" | "right"): { board: number[][]; score: number; moved: boolean } {
  let rotated = board;
  if (dir === "up") rotated = transpose(board);
  if (dir === "down") rotated = reverseRows(transpose(board));
  if (dir === "right") rotated = reverseRows(board);

  let moved = false;
  let totalScore = 0;
  const newBoard = rotated.map((row) => {
    const compressed = compress(row);
    const { merged, score } = merge(compressed);
    if (!moved && JSON.stringify(merged) !== JSON.stringify(compressed)) moved = true;
    totalScore += score;
    return merged;
  });

  let finalBoard = newBoard;
  if (dir === "up") finalBoard = transpose(newBoard);
  if (dir === "down") finalBoard = transpose(reverseRows(newBoard));
  if (dir === "right") finalBoard = reverseRows(newBoard);

  return { board: finalBoard, score: totalScore, moved };
}

export default function Game2048() {
  const [board, setBoard] = useState<number[][]>(emptyBoard());
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  useEffect(() => {
    let b = addRandomTile(emptyBoard());
    b = addRandomTile(b);
    setBoard(b);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (gameOver) return;
      let dir: "up" | "down" | "left" | "right" | null = null;
      switch (e.key) {
        case "ArrowUp":
          dir = "up";
          break;
        case "ArrowDown":
          dir = "down";
          break;
        case "ArrowLeft":
          dir = "left";
          break;
        case "ArrowRight":
          dir = "right";
          break;
      }
      if (dir) {
        const { board: newBoard, score: delta, moved } = move(board, dir);
        if (moved) {
          setBoard(addRandomTile(newBoard));
          setScore((s) => s + delta);
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [board, gameOver]);

  useEffect(() => {
    if (board.flat().some((v) => v >= TARGET)) setGameWon(true);
  }, [board]);

  useEffect(() => {
    const hasEmpty = board.flat().some((v) => v === 0);
    const canMerge = board.flatMap((row, r) =>
      row.map((cell, c) => {
        if (cell === 0) return false;
        const dirs = [
          [r - 1, c],
          [r + 1, c],
          [r, c - 1],
          [r, c + 1],
        ];
        return dirs.some(
          ([nr, nc]) =>
            nr >= 0 &&
            nr < GRID_SIZE &&
            nc >= 0 &&
            nc < GRID_SIZE &&
            board[nr][nc] === cell
        );
      })
    );
    if (!hasEmpty && !canMerge.some((v) => v)) setGameOver(true);
  }, [board]);

  const shareText = `I scored ${score} points in 2048! ${url}`;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-4 gap-2">
        {board.flat().map((v, i) => (
          <div
            key={i}
            className="flex items-center justify-center h-16 w-16 bg-muted rounded-md text-2xl font-bold"
          >
            {v !== 0 ? v : null}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => move(board, "up")}>
          <ArrowUp />
        </Button>
        <Button variant="outline" onClick={() => move(board, "down")}>
          <ArrowDown />
        </Button>
        <Button variant="outline" onClick={() => move(board, "left")}>
          <ArrowLeft />
        </Button>
        <Button variant="outline" onClick={() => move(board, "right")}>
          <ArrowRight />
        </Button>
      </div>
      <div className="text-xl">Score: {score}</div>
      {gameOver && (
        <div className="flex flex-col items-center gap-2">
          <div className="text-2xl font-bold">
            {gameWon ? "You Win!" : "Game Over"}
          </div>
          <Share text={shareText} />
        </div>
      )}
    </div>
  );
}
