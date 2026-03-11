"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/app/components/ui/Button";
import { RegulationSection, RegulationsContent } from "@/types";

const emptySection: RegulationSection = { title: "", content: "" };

export default function AdminRegulationsPage() {
  const [data, setData] = useState<RegulationsContent>({
    title: "",
    intro: "",
    sections: [emptySection],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadRegulations = async () => {
      setIsLoading(true);
      setError("");

      try {
        const res = await fetch("/api/regulations");
        if (!res.ok) throw new Error("Не вдалося завантажити регламент");
        const payload = (await res.json()) as RegulationsContent;
        setData({
          title: payload.title,
          intro: payload.intro,
          sections: payload.sections.length > 0 ? payload.sections : [emptySection],
        });
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadRegulations();
  }, []);

  const updateSection = (index: number, field: keyof RegulationSection, value: string) => {
    setData((prev) => ({
      ...prev,
      sections: prev.sections.map((section, i) =>
        i === index ? { ...section, [field]: value } : section,
      ),
    }));
  };

  const addSection = () => {
    setData((prev) => ({
      ...prev,
      sections: [...prev.sections, { ...emptySection }],
    }));
  };

  const removeSection = (index: number) => {
    setData((prev) => ({
      ...prev,
      sections:
        prev.sections.length === 1
          ? [{ ...emptySection }]
          : prev.sections.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const cleanedSections = data.sections
      .map((section) => ({
        title: section.title.trim(),
        content: section.content.trim(),
      }))
      .filter((section) => section.title && section.content);

    if (!data.title.trim() || !data.intro.trim() || cleanedSections.length === 0) {
      setError("Заповніть заголовок, опис і хоча б один валідний пункт регламенту");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/regulations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title.trim(),
          intro: data.intro.trim(),
          sections: cleanedSections,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string; };
        throw new Error(body.error ?? "Не вдалося зберегти регламент");
      }

      setSuccess("Регламент успішно оновлено");
      setData((prev) => ({ ...prev, sections: cleanedSections }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-zinc-500 hover:text-white text-sm mb-6 block transition-colors">
        ← Адмін-панель
      </Link>

      <h1 className="text-3xl font-black text-white mb-8">Регламент</h1>

      {isLoading ? (
        <p className="text-zinc-400">Завантаження...</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h2 className="text-lg font-bold text-white">Загальна інформація</h2>
            <input
              type="text"
              value={data.title}
              onChange={(e) => setData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Заголовок сторінки"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
              required
            />
            <textarea
              value={data.intro}
              onChange={(e) => setData((prev) => ({ ...prev, intro: e.target.value }))}
              placeholder="Короткий опис"
              className="w-full min-h-24 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
              required
            />
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Пункти регламенту</h2>
              <Button type="button" variant="secondary" size="sm" onClick={addSection}>
                Додати пункт
              </Button>
            </div>

            <div className="space-y-4">
              {data.sections.map((section, index) => (
                <div key={`section-${index}`} className="border border-zinc-800 rounded-lg p-4 space-y-3">
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => updateSection(index, "title", e.target.value)}
                    placeholder={`Заголовок пункту ${index + 1}`}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                    required
                  />
                  <textarea
                    value={section.content}
                    onChange={(e) => updateSection(index, "content", e.target.value)}
                    placeholder="Текст пункту"
                    className="w-full min-h-28 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                    required
                  />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => removeSection(index)}
                    >
                      Видалити пункт
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          {success && <p className="text-emerald-400 text-sm">{success}</p>}

          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Збереження..." : "Зберегти регламент"}
          </Button>
        </form>
      )}
    </main>
  );
}
