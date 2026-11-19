import { ReadingDemo } from "./reading-demo";
import { t } from "@/i18n";

export default function DemoPage() {
  return (
    <section className="border-t">
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        <ReadingDemo />
        <p className="mt-16 text-center font-sans text-xs text-muted-foreground">{t("demo.note")}</p>
      </div>
    </section>
  );
}
