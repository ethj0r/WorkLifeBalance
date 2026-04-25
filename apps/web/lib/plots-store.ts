"use client";

import { plots as mockPlots } from "@/lib/mock-data";
import type { Plot } from "@/lib/types";

const STORAGE_KEY = "carbonlink.plots";

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readLocalPlots(): Plot[] {
  if (!canUseLocalStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalPlots(plots: Plot[]) {
  if (!canUseLocalStorage()) return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plots));
}

function mergePlots(mock: Plot[], local: Plot[]) {
  const byId = new Map<string, Plot>();

  mock.forEach((plot) => byId.set(plot.id, plot));
  local.forEach((plot) => byId.set(plot.id, plot));

  return Array.from(byId.values());
}

export function getPlots() {
  return mergePlots(mockPlots, readLocalPlots());
}

export function getLocalPlots() {
  return readLocalPlots();
}

export function addPlot(plot: Plot) {
  const localPlots = readLocalPlots();
  const withoutDuplicate = localPlots.filter((item) => item.id !== plot.id);
  const next = [plot, ...withoutDuplicate];

  writeLocalPlots(next);

  return plot;
}

export function getPlotById(id: string) {
  return getPlots().find((plot) => plot.id === id) ?? null;
}