import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/PolicyPage";

export const Route = createFileRoute("/size-guide")({
  head: () => ({ meta: [{ title: "Size Guide — Royal Boutiques" }, { name: "description", content: "Find your perfect fit with our detailed size guide for clothing and shoes." }] }),
  component: () => (
    <PolicyPage eyebrow="Fit & Sizing" title="Size Guide">
      <p>Our sizing follows international standards. Measurements below are in centimetres.</p>
      <h2>Women's Clothing</h2>
      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-charcoal/15 text-left">
              <th className="py-3 px-2">Size</th><th>Bust</th><th>Waist</th><th>Hips</th>
            </tr>
          </thead>
          <tbody>
            {[["XS (6)", 80, 62, 86], ["S (8)", 84, 66, 90], ["M (10)", 88, 70, 94], ["L (12)", 92, 74, 98], ["XL (14)", 96, 78, 102]].map((r) => (
              <tr key={r[0] as string} className="border-b border-charcoal/10">
                <td className="py-3 px-2 font-medium">{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2>How to Measure</h2>
      <ul>
        <li><strong>Bust:</strong> Measure around the fullest part of your chest, keeping the tape level.</li>
        <li><strong>Waist:</strong> Measure around the narrowest part of your natural waist.</li>
        <li><strong>Hips:</strong> Measure around the fullest part of your hips, about 20cm below the waist.</li>
      </ul>
      <p>If you are between sizes we recommend sizing up. Our concierge team is happy to advise.</p>
    </PolicyPage>
  ),
});
