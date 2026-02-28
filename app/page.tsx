import NavBar from "@/components/NavBar";
import CreateRideAI from "@/components/CreateRideAI";
import RideFeed from "@/components/RideFeed";

export default function Home() {
  return (
    <div className="flex min-h-screen justify-center font-sans">
      <main className="flex min-h-screen w-full max-w-md flex-col items-center py-12 px-6 sm:items-start">
        <NavBar />

        <CreateRideAI />

        <section className="w-full flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-sm font-medium opacity-70 uppercase tracking-wider">
              Available Rides
            </h2>
          </div>
          <RideFeed />
        </section>
      </main>
    </div>
  );
}
