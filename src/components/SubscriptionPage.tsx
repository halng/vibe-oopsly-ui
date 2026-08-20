import React, { useState } from 'react';
import { Check, X, Sparkles, Star, Shield, ArrowRight } from 'lucide-react';

interface SubscriptionPageProps {
  onClose: () => void;
  currentPlan?: 'free' | 'pro' | 'lifetime';
}

export const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ onClose, currentPlan = 'free' }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSubscribe = (planId: string) => {
    setIsLoading(planId);
    // Simulate API call for checkout
    setTimeout(() => {
      setIsLoading(null);
      alert(`This is a demo. In a real app, you would be redirected to Stripe checkout for the ${planId} plan.`);
      onClose();
    }, 1500);
  };

  const isYearly = billingCycle === 'yearly';

  return (
    <div className="w-full animate-fade-in bg-[var(--theme-bg)] pb-12">
      {/* Header / Nav */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-[#8BC34A] text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-black text-[var(--theme-text)] tracking-tight text-xl">Oopsly Pro</span>
        </div>
        <button 
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer text-sm font-bold flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          Back
        </button>
      </div>

      <div className="max-w-7xl mx-auto py-8 sm:py-12">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl sm:text-5xl font-black text-[var(--theme-text)] tracking-tight">
            Supercharge your memory.
          </h1>
          <p className="text-xl text-stone-600 dark:text-stone-400">
            Unlock unlimited decks, advanced AI generation, and exclusive garden seeds.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center mt-10">
            <div className="bg-stone-100 dark:bg-stone-800 p-1.5 rounded-2xl flex items-center shadow-inner">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  !isYearly ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  isYearly ? 'bg-[#8BC34A] text-white shadow-sm shadow-[#8BC34A]/20' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
                }`}
              >
                Yearly <span className={isYearly ? 'text-white/80 text-xs' : 'text-[#8BC34A] text-xs'}>Save 20%</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Basic Plan */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-8 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col relative">
            <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">Basic</h3>
            <p className="text-stone-500 dark:text-stone-400 text-sm mt-2">Everything you need to start learning.</p>
            
            <div className="my-6">
              <span className="text-4xl font-black text-stone-900 dark:text-stone-100">$0</span>
              <span className="text-stone-500 dark:text-stone-400">/forever</span>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {['Up to 3 decks', 'FSRS Algorithm', 'Basic stats', 'Standard garden plants', 'Web access'].map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#8BC34A] shrink-0" />
                  <span className="text-stone-600 dark:text-stone-400 text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              disabled={currentPlan === 'free'}
              className="w-full py-3.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-sm disabled:opacity-50 transition-colors"
            >
              {currentPlan === 'free' ? 'Current Plan' : 'Downgrade'}
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-stone-900 dark:bg-black rounded-3xl p-8 border border-stone-800 shadow-2xl flex flex-col relative transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-400 text-amber-950 text-xs font-black uppercase tracking-widest py-1.5 px-4 rounded-full flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-950" /> Most Popular
            </div>
            
            <h3 className="text-xl font-bold text-white">Pro</h3>
            <p className="text-stone-400 text-sm mt-2">For serious learners and students.</p>
            
            <div className="my-6">
              <span className="text-4xl font-black text-white">${isYearly ? '7.99' : '9.99'}</span>
              <span className="text-stone-400">/month</span>
              {isYearly && <p className="text-stone-400 text-xs mt-1">Billed $95.88 yearly</p>}
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {['Unlimited decks & cards', 'AI Card Generation (100/mo)', 'Advanced analytics & heatmaps', 'Exclusive rare seeds', 'Multiplayer host capabilities', 'Priority support'].map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#8BC34A] shrink-0" />
                  <span className="text-stone-300 text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe('pro')}
              disabled={currentPlan === 'pro'}
              className="w-full py-3.5 rounded-xl bg-[#8BC34A] hover:bg-[#7CB342] text-white font-bold text-sm disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading === 'pro' ? 'Loading...' : currentPlan === 'pro' ? 'Current Plan' : 'Get Oopsly Pro'}
              {!isLoading && currentPlan !== 'pro' && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>

          {/* Lifetime Plan */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-8 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col relative">
            <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">Lifetime</h3>
            <p className="text-stone-500 dark:text-stone-400 text-sm mt-2">Pay once, learn forever.</p>
            
            <div className="my-6">
              <span className="text-4xl font-black text-stone-900 dark:text-stone-100">$199</span>
              <span className="text-stone-500 dark:text-stone-400">/once</span>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {['Everything in Pro', 'Unlimited AI Generations', 'All future updates', 'Early access to features', 'Founder badge in community'].map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#8BC34A] shrink-0" />
                  <span className="text-stone-600 dark:text-stone-400 text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe('lifetime')}
              disabled={currentPlan === 'lifetime'}
              className="w-full py-3.5 rounded-xl bg-stone-900 dark:bg-stone-800 hover:bg-stone-800 dark:hover:bg-stone-700 text-white font-bold text-sm disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading === 'lifetime' ? 'Loading...' : currentPlan === 'lifetime' ? 'Current Plan' : 'Get Lifetime'}
              {!isLoading && currentPlan !== 'lifetime' && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* FAQ or Trust Badges */}
        <div className="mt-24 pt-12 border-t border-stone-200 dark:border-stone-800 text-center flex flex-col items-center">
          <div className="flex items-center gap-2 text-stone-500 mb-4">
            <Shield className="w-5 h-5" />
            <span className="font-medium text-sm">Secure checkout powered by Stripe</span>
          </div>
          <p className="text-stone-400 dark:text-stone-500 text-sm">
            You can cancel your subscription at any time. For refunds, please contact support within 14 days.
          </p>
        </div>
      </div>
    </div>
  );
};
