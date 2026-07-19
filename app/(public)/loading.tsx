export default function Loading() {
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-3xl animate-pulse flex-col gap-4 px-6 py-24" aria-hidden="true">
      <div className="h-10 w-2/3 rounded-md bg-altr-silver/40" />
      <div className="h-4 w-full rounded-md bg-altr-silver/30" />
      <div className="h-4 w-5/6 rounded-md bg-altr-silver/30" />
    </div>
  );
}
