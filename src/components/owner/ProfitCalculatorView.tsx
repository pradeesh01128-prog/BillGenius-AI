import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatINR, formatINRLakhs } from '../../utils/currency';
import {
  Calculator,
  TrendingUp,
  Percent,
  Clock,
  PiggyBank,
  CheckCircle2,
  Sliders,
  Sparkles,
  Info,
  Check,
  Building,
} from 'lucide-react';

export const ProfitCalculatorView: React.FC = () => {
  const { investmentData, updateInvestmentData, language } = useStore();
  const [saveBanner, setSaveBanner] = useState<string | null>(null);

  const isTa = language === 'ta';

  // Local interactive calculation state initialized with store data
  const [capitalInvestment, setCapitalInvestment] = useState(
    investmentData.capitalInvestment || 1800000
  );
  const [targetMonthlySales, setTargetMonthlySales] = useState(650000);
  const [grossMarginPercent, setGrossMarginPercent] = useState(36);

  // Overhead cost breakdown (Tamil Nadu retail SME defaults)
  const [rent, setRent] = useState(investmentData.monthlyRent || 45000);
  const [salaries, setSalaries] = useState(
    investmentData.monthlyStaffSalaries ?? investmentData.staffSalaries ?? 110000
  );
  const [utilities, setUtilities] = useState(
    investmentData.monthlyUtilities ?? investmentData.electricityUtilities ?? 18500
  );
  const [marketing, setMarketing] = useState(
    investmentData.monthlyMarketing ?? investmentData.marketingExpenses ?? 12000
  );
  const [miscellaneous, setMiscellaneous] = useState(
    investmentData.monthlyMiscellaneous ?? investmentData.otherFixedCosts ?? 9500
  );

  // Live Calculations
  const monthlyGrossProfit = (targetMonthlySales * grossMarginPercent) / 100;
  const totalMonthlyOpex = rent + salaries + utilities + marketing + miscellaneous;
  const monthlyNetProfit = monthlyGrossProfit - totalMonthlyOpex;
  const netProfitMarginPercent = targetMonthlySales > 0 ? (monthlyNetProfit / targetMonthlySales) * 100 : 0;
  const annualNetProfit = monthlyNetProfit * 12;

  // Payback period in months
  const paybackMonths =
    monthlyNetProfit > 0 ? (capitalInvestment / monthlyNetProfit).toFixed(1) : '∞ (Unprofitable)';

  // ROI % per year
  const annualRoiPercent =
    capitalInvestment > 0 ? ((annualNetProfit / capitalInvestment) * 100).toFixed(1) : '0';

  // Break-even monthly sales required
  const breakEvenSales = grossMarginPercent > 0 ? (totalMonthlyOpex / (grossMarginPercent / 100)) : 0;

  const handleSaveToSettings = () => {
    updateInvestmentData({
      capitalInvestment,
      monthlyRent: rent,
      staffSalaries: salaries,
      monthlyStaffSalaries: salaries,
      electricityUtilities: utilities,
      monthlyUtilities: utilities,
      marketingExpenses: marketing,
      monthlyMarketing: marketing,
      otherFixedCosts: miscellaneous,
      monthlyMiscellaneous: miscellaneous,
    });
    setSaveBanner('Tamil Nadu investment & overhead baseline updated successfully!');
    setTimeout(() => setSaveBanner(null), 3500);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-600/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {isTa ? 'தமிழ்நாடு தொழில் முதலீடு, லாபம் & ROI கால்குலேட்டர்' : 'Tamil Nadu Investment, Profit & ROI Simulator (₹ INR)'}
            </h3>
            <p className="text-xs text-slate-400">
              {isTa ? 'மாத வாடகை, சம்பளம், TNEB மின்கட்டணம் மற்றும் நிகர லாப பகுப்பாய்வு' : 'Model store overheads (Rent, Salaries, TNEB, OPEX), margins, and payback in Indian Rupees'}
            </p>
          </div>
        </div>

        <button
          id="save-roi-baseline-button"
          onClick={handleSaveToSettings}
          className="py-2 px-4 rounded-xl bg-teal-600 text-white font-bold text-xs shadow-md shadow-teal-500/20 hover:bg-teal-700 transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <CheckCircle2 className="w-4 h-4" />
          {isTa ? 'அடிப்படைக் கணக்காக சேமி' : 'Save as Baseline'}
        </button>
      </div>

      {saveBanner && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{saveBanner}</span>
        </div>
      )}

      {/* Main Results KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{isTa ? 'மாத நிகர லாபம்' : 'Monthly Net Profit'}</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              ₹
            </div>
          </div>
          <p
            className={`text-2xl font-black mt-1 ${
              monthlyNetProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {formatINR(monthlyNetProfit)}
          </p>
          <span className="text-[11px] text-slate-400">
            {isTa ? 'நிகர விளிம்பு:' : 'Net Margin:'} <strong>{netProfitMarginPercent.toFixed(1)}%</strong>
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{isTa ? 'முதலீடு திரும்ப பெறும் காலம்' : 'Estimated Payback Period'}</span>
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {paybackMonths} {monthlyNetProfit > 0 ? (isTa ? 'மாதங்கள்' : 'Months') : ''}
          </p>
          <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">
            Time to recover {formatINRLakhs(capitalInvestment)} capital
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{isTa ? 'ஆண்டு ROI வருவாய்' : 'Annualized ROI'}</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-600 mt-1">
            {annualRoiPercent}% / yr
          </p>
          <span className="text-[11px] text-slate-400">
            Annual Net: {formatINR(annualNetProfit, false)}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{isTa ? 'சமநிலை இலக்கு விற்பனை' : 'Break-Even Sales Target'}</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatINR(breakEvenSales, false)} / mo
          </p>
          <span className="text-[11px] text-amber-600 font-medium">
            Covers {formatINR(totalMonthlyOpex, false)} OPEX
          </span>
        </div>
      </div>

      {/* Interactive Controls & Overhead Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Revenue & Margin Sliders (6 cols) */}
        <div className="lg:col-span-6 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Sliders className="w-4 h-4 text-teal-600" />
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {isTa ? 'வருவாய் & விளிம்பு உருவகப்படுத்துதல்' : 'Revenue & Margin Scenario Modeler'}
            </h4>
          </div>

          {/* Capital Investment */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-600 dark:text-slate-400">{isTa ? 'தொடக்க முதலீடு:' : 'Initial Capital Investment:'}</span>
              <span className="text-teal-600">{formatINR(capitalInvestment, false)} ({formatINRLakhs(capitalInvestment)})</span>
            </div>
            <input
              type="range"
              min="500000"
              max="5000000"
              step="50000"
              value={capitalInvestment}
              onChange={e => setCapitalInvestment(Number(e.target.value))}
              className="w-full accent-teal-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>₹5 Lakhs</span>
              <span>₹25 Lakhs</span>
              <span>₹50 Lakhs</span>
            </div>
          </div>

          {/* Monthly Sales Revenue */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-600 dark:text-slate-400">{isTa ? 'இலக்கு மாத விற்பனை:' : 'Target Monthly Sales:'}</span>
              <span className="text-teal-600">{formatINR(targetMonthlySales, false)} / mo</span>
            </div>
            <input
              type="range"
              min="200000"
              max="3000000"
              step="25000"
              value={targetMonthlySales}
              onChange={e => setTargetMonthlySales(Number(e.target.value))}
              className="w-full accent-teal-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>₹2 Lakhs</span>
              <span>₹15 Lakhs</span>
              <span>₹30 Lakhs</span>
            </div>
          </div>

          {/* Gross Margin % */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-600 dark:text-slate-400">{isTa ? 'மொத்த விளிம்பு (Gross Margin %):' : 'Target Gross Margin:'}</span>
              <span className="text-teal-600">{grossMarginPercent}%</span>
            </div>
            <input
              type="range"
              min="15"
              max="60"
              step="1"
              value={grossMarginPercent}
              onChange={e => setGrossMarginPercent(Number(e.target.value))}
              className="w-full accent-teal-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>15% (Wholesale)</span>
              <span>36% (Supermarket Average)</span>
              <span>60% (Organic / Specialty)</span>
            </div>
          </div>

          {/* Breakdown summary card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>{isTa ? 'மாத மொத்த வருவாய்:' : 'Monthly Gross Revenue:'}</span>
              <span className="font-semibold">{formatINR(targetMonthlySales)}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>{isTa ? 'சரக்கு கொள்முதல் செலவு (COGS):' : 'Cost of Goods Sold (COGS):'}</span>
              <span className="font-semibold text-rose-500">
                -{formatINR((targetMonthlySales * (100 - grossMarginPercent)) / 100)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
              <span>{isTa ? 'மாத மொத்த லாபம்:' : 'Monthly Gross Profit:'}</span>
              <span className="text-teal-600">{formatINR(monthlyGrossProfit)}</span>
            </div>
          </div>
        </div>

        {/* Right: Monthly Operating Expenses (OPEX) (6 cols) */}
        <div className="lg:col-span-6 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {isTa ? 'மாத நிர்வாகச் செலவுகள் (OPEX)' : 'Monthly Overhead Expenses (OPEX in ₹)'}
            </h4>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white">
              Total: {formatINR(totalMonthlyOpex, false)} / mo
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                {isTa ? 'கடை வாடகை (₹ / மாதம்):' : 'Store Rent (₹ / mo):'}
              </label>
              <input
                type="number"
                value={rent}
                onChange={e => setRent(parseFloat(e.target.value) || 0)}
                className="w-full p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                {isTa ? 'பணியாளர் ஊதியம் (₹ / மாதம்):' : 'Staff Payroll (₹ / mo):'}
              </label>
              <input
                type="number"
                value={salaries}
                onChange={e => setSalaries(parseFloat(e.target.value) || 0)}
                className="w-full p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                {isTa ? 'TNEB மின்சாரம் & பயன்பாடுகள் (₹):' : 'TNEB Electricity & Utilities (₹):'}
              </label>
              <input
                type="number"
                value={utilities}
                onChange={e => setUtilities(parseFloat(e.target.value) || 0)}
                className="w-full p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                {isTa ? 'விளம்பரம் & மார்க்கெட்டிங் (₹):' : 'Marketing & Local Ads (₹):'}
              </label>
              <input
                type="number"
                value={marketing}
                onChange={e => setMarketing(parseFloat(e.target.value) || 0)}
                className="w-full p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              />
            </div>

            <div className="col-span-full">
              <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                {isTa ? 'POS சாப்ட்வேர், பராமரிப்பு & இதர செலவுகள் (₹):' : 'POS Software, Maintenance & Misc (₹ / mo):'}
              </label>
              <input
                type="number"
                value={miscellaneous}
                onChange={e => setMiscellaneous(parseFloat(e.target.value) || 0)}
                className="w-full p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>{isTa ? 'தமிழ்நாடு சில்லறை நிதி ஆரோக்கிய ஆய்வு' : 'Tamil Nadu Retail Health Analysis'}</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
              At current modeled parameters, your operation yields an annualized return of{' '}
              <strong>{annualRoiPercent}%</strong> with a monthly cash surplus of{' '}
              <strong>{formatINR(monthlyNetProfit)}</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
