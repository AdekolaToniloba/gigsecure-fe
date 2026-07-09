type RiskDataCardGridProps = {
  children: React.ReactNode;
};

export function RiskDataCardGrid({ children }: RiskDataCardGridProps) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
      {children}
    </div>
  );
}
