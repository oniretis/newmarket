import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import Heading from "@/components/base/common/heading";
import Tags from "@/components/base/common/tags";
import CounterBox from "@/components/containers/store/counter-box";
import { Button } from "@/components/ui/button";

export default function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const carouselImages = [
    "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=1974&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1974&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?q=80&w=1974&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1974&auto=format&fit=crop",
  ];

  const counters = [
    { value: "1,500 +", label: "Properties" },
    { value: "50 +", label: "Cars" },
    { value: "30%", label: "Mobiles" },
    { value: "95%", label: "Customer Satisfaction Rate" },
  ];

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? carouselImages.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === carouselImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  // Auto-slide every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      goToNext();
    }, 4000);

    return () => clearInterval(interval);
  }, []);
  return (
    <section className="@container container mx-auto space-y-8 px-4 pt-[10px]">
      <div className="relative rounded-2xl border border-dashed">
        <div className="relative">
          <div className="relative overflow-hidden rounded-2xl rounded-b-none">
            <img
              src={carouselImages[currentIndex]}
              alt={`Hero slide ${currentIndex + 1}`}
              className="h-[420px] w-full object-cover transition-opacity duration-500"
            />

            {/* Navigation buttons */}
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            {/* Dot indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {carouselImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    index === currentIndex
                      ? "bg-white"
                      : "bg-white/50 hover:bg-white/70"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="-translate-x-1/2 -bottom-12 absolute left-1/2">
            <div className="relative flex h-[94px] w-[198px] items-center justify-center rounded-2xl bg-background">
              <div className="flex items-center justify-center">
                <Button
                  variant="secondary"
                  size="lg"
                  type="button"
                  className="h-16 gap-2 px-7! text-lg border-2 border-dashed hover:border-primary/50 hover:bg-primary/5 hover:text-primary hover:shadow-md hover:scale-105 transition-all duration-300 group"
                >
                  <span className="transition-transform duration-200 group-hover:translate-x-1">
                    Shop now
                  </span>
                  <ArrowRight className="size-5 transition-transform duration-200 group-hover:translate-x-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid @4xl:grid-cols-2 grid-cols-1 gap-8">
          <div className="space-y-8 @4xl:p-12 @6xl:p-[60px] @7xl:p-20 p-3 pt-14">
            <Tags items={["All", "Properties", "Cars", "Mobiles"]} />
            <Heading
              title="Your number one marketplace"
              subtitle="Explore a world of fashion at heywhymarketplace, where trends meet affordability. Immerse yourself in the latest styles and seize exclusive promotions."
            />
          </div>
          <CounterBox items={counters} />
        </div>
      </div>
    </section>
  );
}
