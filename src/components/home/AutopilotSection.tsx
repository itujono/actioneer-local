import { useState } from "react";
import { Mail, BarChart4, Briefcase } from "lucide-react";

export default function AutopilotSection() {
  const [activeTab, setActiveTab] = useState("receipts");

  const features = [
    {
      id: "receipts",
      title: "Receipt Wizardry",
      icon: Mail,
      color: "heliotrope",
      description: "Never manually enter another expense.",
      details:
        "Every receipt and invoice email becomes a perfectly categorized financial entry—expenses, income, refunds, you name it. Complete with merchant details, amounts, and smart categorization that knows the difference between your coffee habit and that freelance payment.",
      testimonial: (
        <>
          "I used to spend Sunday mornings sorting receipts. Now I spend them
          sleeping in!"
          <br />— Marshall M.
        </>
      ),
      testimonialImage: "/public/marshall.webp",
      imagePlaceholder: "📧💰", // Placeholder for now
    },
    {
      id: "travel",
      title: "Travel Genius",
      icon: BarChart4,
      color: "gold",
      description: "Stop juggling 47 browser tabs.",
      details:
        "Compare hotel prices, flight options, and attractions instantly. Add trips to your calendar with one click.",
      testimonial: (
        <>
          "Saved $400 on my last trip just by seeing all options in one place!"
          <br />— Lebron James
        </>
      ),
      testimonialImage: "/public/lebron.webp",
      imagePlaceholder: "🌍✈️",
    },
    {
      id: "jobs",
      title: "Job Hunt Hero",
      icon: Briefcase,
      color: "jade",
      description: "Turn job hunting chaos into zen.",
      details:
        'Every application email gets organized, tracked, and followed up automatically. No more "Did I apply there already?" moments.',
      testimonial: (
        <>
          "Landed my dream job because I never missed a follow-up!"
          <br />— Mariah C.
        </>
      ),
      testimonialImage: "/public/mariah-carey.webp",
      imagePlaceholder: "💼📈",
    },
    {
      id: "more",
      title: "More to come...",
      icon: null,
      color: "bittersweet",
      description: "We're just getting started.",
      details:
        "We're working really hard to add more features to Actioneer; medical appointments, package deliveries, subscription renewals, event tickets, and so much more. Your inbox will become the ultimate command center for your entire digital life.",
      testimonial: (
        <>
          "Feels like magic! Can't wait to see what else they'll automate!"
          <br />— Jackie C.
        </>
      ),
      testimonialImage: "/public/jackie.jpg",
      imagePlaceholder: "✨🔮",
    },
  ];

  const activeFeature = features.find((f) => f.id === activeTab) || features[0];

  return (
    <div className="bg-concrete/10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16 pb-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-thunder mb-6">
            Your personal email autopilot
          </h2>
          <p className="text-xl text-gray max-w-3xl mx-auto">
            While you sleep, eat, or binge-watch Netflix, Actioneer is busy
            turning your messy inbox into organized, actionable insights. It's
            like having a super-efficient assistant who never takes a day off.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left side - Vertical tabs (spans 2 columns) */}
          <div className="lg:col-span-2 space-y-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              const isActive = activeTab === feature.id;

              return (
                <button
                  key={feature.id}
                  onClick={() => setActiveTab(feature.id)}
                  className={`w-full text-left p-6 rounded-2xl border-2 transition-all duration-300 group ${
                    isActive
                      ? `bg-${feature.color}/20 border-${feature.color} shadow-lg`
                      : "bg-white/50 border-gray-light hover:bg-white/80 hover:border-gray"
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    {Icon && (
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                          isActive
                            ? `bg-${feature.color}`
                            : "bg-gray-light group-hover:bg-gray"
                        }`}
                      >
                        <Icon
                          className={`h-6 w-6 ${
                            isActive ? "text-white" : "text-gray-dark"
                          }`}
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3
                        className={`text-xl font-bold mb-2 ${
                          isActive ? "text-thunder" : "text-gray-dark"
                        }`}
                      >
                        {feature.title}
                      </h3>
                      <p
                        className={`text-sm ${
                          isActive ? "text-gray-dark" : "text-gray"
                        }`}
                      >
                        <strong
                          className={
                            isActive
                              ? `text-${feature.color}`
                              : "text-gray-dark"
                          }
                        >
                          {feature.description}
                        </strong>
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right side - Content display (spans 2 columns) */}
          <div className="lg:col-span-3">
            <div
              className={`card-playful bg-${activeFeature.color}/10 border-${activeFeature.color}/20 min-h-[40rem] flex flex-col`}
            >
              {/* Image placeholder */}
              <div
                className={`w-full h-64 bg-${activeFeature.color}/20 rounded-2xl mb-6 flex items-center justify-center text-6xl flex-shrink-0`}
              >
                {activeFeature.imagePlaceholder}
              </div>

              {/* Content */}
              <div className="space-y-4 flex-1 flex flex-col">
                <h3 className="text-2xl font-bold text-thunder">
                  {activeFeature.title}
                </h3>
                <p className="text-gray-dark text-lg flex-1">
                  <strong className={`text-${activeFeature.color}`}>
                    {activeFeature.description}
                  </strong>{" "}
                  {activeFeature.details}
                </p>
                <div className="text-sm text-gray bg-white/50 rounded-lg p-3 mt-auto flex items-center justify-between gap-4">
                  <p>{activeFeature.testimonial}</p>
                  <img
                    src={activeFeature.testimonialImage}
                    alt={activeFeature.title}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
