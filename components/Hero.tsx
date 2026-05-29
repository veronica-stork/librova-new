import SearchControls from './SearchControls'

export default function HeroSection() {
  return (
    <section className="relative flex flex-col items-center w-full mb-12">
      
      {/* 1. The Brand Background */}
      {/* Upgraded to use your vibrant teal blending into the rich dark color. */}
      <div className="w-full bg-gradient-to-br from-librova-teal to-librova-dark px-4 pt-16 pb-24 text-center rounded-b-[2.5rem] shadow-inner">
        <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight drop-shadow-sm">
          Find Library Events Near You
        </h1>
        <p className="text-librova-light text-lg md:text-xl max-w-2xl mx-auto font-medium opacity-90">
          Discover programs, workshops, and activities happening in your local network.
        </p>
      </div>

      {/* 2. The Overlapping Search Controls */}
      {/* The magic here is `-mt-12` (negative margin) and `z-10` to pull the search box up over the background */}
      <div className="w-full max-w-5xl px-4 -mt-12 relative z-10">
        <SearchControls />
      </div>
      
    </section>
  );
}