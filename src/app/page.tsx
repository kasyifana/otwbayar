'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { Group, Member, BudgetCategory, PaymentProof, Expense, ActivityFeedItem } from '@/types';
import { Header } from '@/components/Header';
import { HeroCard } from '@/components/HeroCard';
import { MemberGrid } from '@/components/MemberGrid';
import { BudgetBreakdown } from '@/components/BudgetBreakdown';
import { DepositModal } from '@/components/DepositModal';
import { ExpenseModal } from '@/components/ExpenseModal';
import { CoordinatorReviewModal } from '@/components/CoordinatorReviewModal';
import { ShareModal } from '@/components/ShareModal';
import { CreateGroupModal } from '@/components/CreateGroupModal';
import { ExpenseTab } from '@/components/ExpenseTab';
import { ActivityFeed } from '@/components/ActivityFeed';
import { SplashScreen } from '@/components/SplashScreen';
import { LandingPage } from '@/components/LandingPage';
import { GoogleAuthGate } from '@/components/GoogleAuthGate';
import { TripSelectorModal, UserTripItem } from '@/components/TripSelectorModal';
import { useSession, signIn } from 'next-auth/react';
import { Home, Receipt, ShieldCheck, Sparkles } from 'lucide-react';

interface DashboardData {
  group: Group;
  members: Member[];
  categories: BudgetCategory[];
  proofs: PaymentProof[];
  expenses: Expense[];
  activities: ActivityFeedItem[];
  stats: {
    totalTarget: number;
    currentTotal: number;
    remainingCash?: number;
    progressPercent: number;
    pendingCount: number;
    remainingAmount: number;
  };
  auth: {
    isCoordinator: boolean;
    currentMember: Member | null;
  };
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: authStatus } = useSession();
  const urlGroupId = searchParams.get('groupId');
  const urlToken = searchParams.get('token');

  // LocalStorage session persistence for token
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return urlToken || localStorage.getItem('otw_trip_token');
    }
    return urlToken;
  });
  const [groupId, setGroupId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return urlGroupId || localStorage.getItem('otw_trip_group_id');
    }
    return urlGroupId;
  });

  useEffect(() => {
    if (urlToken) {
      localStorage.setItem('otw_trip_token', urlToken);
      if (urlGroupId) {
        localStorage.setItem('otw_trip_group_id', urlGroupId);
      } else {
        localStorage.removeItem('otw_trip_group_id');
      }
      // microtask deferred update
      const t = setTimeout(() => {
        setToken(urlToken);
        setGroupId(urlGroupId || null);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [urlToken, urlGroupId]);

  // If user is authenticated and we have a token, link account to this token
  useEffect(() => {
    if (session?.user?.email && token) {
      fetch('/api/auth/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      }).catch((err) => console.warn('Account link error:', err));
    }
  }, [session, token]);

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'budget' | 'expenses'>('dashboard');

  // Modals state
  const [showDeposit, setShowDeposit] = useState(false);
  const [showExpense, setShowExpense] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showTripSelector, setShowTripSelector] = useState(false);
  const [userTrips, setUserTrips] = useState<UserTripItem[]>([]);

  // Fetch all trips for authenticated user
  useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/user/trips')
        .then((res) => (res.ok ? res.json() : { trips: [] }))
        .then((data) => {
          if (data.trips && Array.isArray(data.trips)) {
            setUserTrips(data.trips);
          }
        })
        .catch((err) => console.warn('Failed to fetch user trips', err));
    }
  }, [session?.user?.email]);

  const fetchData = useCallback(async () => {
    const userEmail = session?.user?.email;
    if (!token && !userEmail) {
      setLoading(false);
      return;
    }
    try {
      let url = `/api/groups?`;
      if (token) url += `token=${encodeURIComponent(token)}&`;
      if (groupId) url += `groupId=${encodeURIComponent(groupId)}&`;
      if (userEmail) url += `email=${encodeURIComponent(userEmail)}`;

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        // If token/email is invalid or no authorized member found
        if (!json.auth?.isCoordinator && !json.auth?.currentMember) {
          setData(null);
          setLoading(false);
          return;
        }
        setData(json);

        // Confetti celebration if 100% reached
        if (json.stats?.progressPercent >= 100) {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
          });
        }
      }
    } catch (err) {
      console.error(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [groupId, token, session?.user?.email]);

  useEffect(() => {
    // Invoke fetch in microtask to avoid react-hooks/set-state-in-effect warning
    const t = setTimeout(() => {
      fetchData();
    }, 0);
    // 15 seconds polling interval when tab is active
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchData();
    }, 15000);
    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, [fetchData]);

  // If user is not authenticated yet with Google, show GoogleAuthGate
  if (authStatus === 'loading') {
    return <SplashScreen />;
  }

  if (authStatus === 'unauthenticated') {
    // If user opened with a token or has token stored, ask them to sign in to link
    return <GoogleAuthGate onSignIn={() => signIn('google')} />;
  }

  // If authenticated but no token & no trip found for this email, show Landing Page
  if (!token && !session?.user?.email && !loading) {
    return <LandingPage />;
  }

  if (loading) {
    return <SplashScreen />;
  }

  if (!data) {
    return <LandingPage />;
  }

  const { group, members, categories, proofs, expenses, activities, stats, auth } = data;

  return (
    <div className="flex-1 flex flex-col pb-24">
      <Header
        group={group}
        currentMember={auth.currentMember}
        isCoordinator={auth.isCoordinator}
        onShare={() => setShowShare(true)}
        onCreateNew={() => setShowCreateGroup(true)}
        onOpenTripSelector={() => setShowTripSelector(true)}
      />

      {/* Coordinator action notification */}
      {auth.isCoordinator && stats.pendingCount > 0 && (
        <div className="bg-[#FFF4E5] border-b border-[#FFE0B2] text-[#8F4A00] px-4 py-2 text-xs font-medium flex items-center justify-between">
          <span>
            Ada {stats.pendingCount} bukti setoran menunggu verifikasi kamu.
          </span>
          <button
            onClick={() => setShowReview(true)}
            className="bg-[#8F4A00] text-white text-[11px] px-2.5 py-1 rounded-[6px] hover:bg-[#723B00] cursor-pointer shrink-0 ml-2"
          >
            Review
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="px-4 pt-3 flex gap-4 border-b border-[#E2E8DF] bg-[#F4F6F4]">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`pb-2 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
            activeTab === 'dashboard'
              ? 'border-[#245229] text-[#245229]'
              : 'border-transparent text-[#576458] hover:text-[#172118]'
          }`}
        >
          Overview Tabungan
        </button>
        <button
          onClick={() => setActiveTab('budget')}
          className={`pb-2 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
            activeTab === 'budget'
              ? 'border-[#245229] text-[#245229]'
              : 'border-transparent text-[#576458] hover:text-[#172118]'
          }`}
        >
          Pos Biaya ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-2 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
            activeTab === 'expenses'
              ? 'border-[#245229] text-[#245229]'
              : 'border-transparent text-[#576458] hover:text-[#172118]'
          }`}
        >
          Nota Hari-H ({expenses.length})
        </button>
      </div>

      {/* Main Tab Content */}
      <main className="flex-1 w-full p-4 space-y-4">
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            <HeroCard
              currentAmount={stats.currentTotal}
              targetAmount={stats.totalTarget}
              progressPercent={stats.progressPercent}
              remainingAmount={stats.remainingAmount}
              remainingCash={stats.remainingCash}
              memberCount={members.length}
              onQuickPay={() => setShowDeposit(true)}
              onQuickExpense={() => setShowExpense(true)}
            />

            <MemberGrid
              members={members}
              proofs={proofs}
              currentMemberId={auth.currentMember?.id}
              onSelectMember={(m) => {
                if (auth.isCoordinator && proofs.some((p) => p.member_id === m.id && p.status === 'PENDING')) {
                  setShowReview(true);
                }
              }}
            />

            <ActivityFeed activities={activities} />
          </div>
        )}

        {activeTab === 'budget' && (
          <BudgetBreakdown categories={categories} totalTarget={stats.totalTarget} />
        )}

        {activeTab === 'expenses' && (
          <ExpenseTab
            group={group}
            expenses={expenses}
            members={members}
            onOpenAddExpense={() => setShowExpense(true)}
          />
        )}
      </main>

      {/* Apple-style Floating Glass Bottom Navigation Bar */}
      <nav
        aria-label="Bottom Navigation"
        className="fixed bottom-5 left-0 right-0 z-40 max-w-md md:max-w-lg mx-auto px-4 pointer-events-none"
      >
        <div className="pointer-events-auto bg-white/95 backdrop-blur-2xl border border-stone-200/80 shadow-[0_16px_36px_-6px_rgba(20,44,24,0.2),0_4px_12px_rgba(0,0,0,0.06)] rounded-full p-1.5 flex items-center justify-between gap-1 transition-all">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 min-h-[48px] flex flex-col items-center justify-center gap-1 rounded-full text-xs font-semibold transition-all active:scale-95 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'text-[#1C3B20] bg-emerald-100/70 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/60'
            }`}
          >
            <Home className={`w-[18px] h-[18px] ${activeTab === 'dashboard' ? 'text-[#1C3B20] stroke-[2.4]' : 'text-stone-500'}`} />
            <span className="leading-none text-[11px]">Beranda</span>
          </button>

          <button
            onClick={() => setShowDeposit(true)}
            className="flex-1 min-h-[48px] flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#D96B43] hover:bg-[#c65e38] active:scale-95 text-white text-xs font-bold shadow-[0_4px_16px_rgba(217,107,67,0.45)] transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 stroke-[2.2]" />
            <span className="tracking-wide">Setor</span>
          </button>

          {auth.isCoordinator ? (
            <button
              onClick={() => setShowReview(true)}
              className="flex-1 min-h-[48px] flex flex-col items-center justify-center gap-1 rounded-full text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100/60 active:scale-95 relative cursor-pointer transition-all"
            >
              <div className="relative">
                <ShieldCheck className="w-[18px] h-[18px] text-stone-500 stroke-[2]" />
                {stats.pendingCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center font-tabular shadow-sm ring-2 ring-white">
                    {stats.pendingCount}
                  </span>
                )}
              </div>
              <span className="leading-none text-[11px]">Verifikasi</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('expenses')}
              className={`flex-1 min-h-[48px] flex flex-col items-center justify-center gap-1 rounded-full text-xs font-semibold transition-all active:scale-95 cursor-pointer ${
                activeTab === 'expenses'
                  ? 'text-[#1C3B20] bg-emerald-100/70 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/60'
              }`}
            >
              <Receipt className={`w-[18px] h-[18px] ${activeTab === 'expenses' ? 'text-[#1C3B20] stroke-[2.4]' : 'text-stone-500'}`} />
              <span className="leading-none text-[11px]">Split Bill</span>
            </button>
          )}
        </div>
      </nav>

      {/* Modals */}
      <DepositModal
        isOpen={showDeposit}
        onClose={() => setShowDeposit(false)}
        group={group}
        members={members}
        currentMember={auth.currentMember}
        onSuccess={fetchData}
      />

      <ExpenseModal
        isOpen={showExpense}
        onClose={() => setShowExpense(false)}
        group={group}
        members={members}
        categories={categories}
        currentMember={auth.currentMember}
        onSuccess={fetchData}
      />

      {auth.isCoordinator && (
        <CoordinatorReviewModal
          isOpen={showReview}
          onClose={() => setShowReview(false)}
          group={group}
          proofs={proofs}
          coordinatorToken={group.coordinator_token}
          onReviewed={fetchData}
        />
      )}

      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        group={group}
        members={members}
      />

      <TripSelectorModal
        isOpen={showTripSelector}
        onClose={() => setShowTripSelector(false)}
        trips={userTrips}
        currentTripId={group.id}
        onSelectTrip={(t) => {
          setToken(t.token);
          setGroupId(t.groupId);
          localStorage.setItem('otw_trip_token', t.token);
          localStorage.setItem('otw_trip_group_id', t.groupId);
          router.push(`/?token=${t.token}`);
        }}
        onCreateNewTrip={() => setShowCreateGroup(true)}
      />

      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreated={(newGroupId: string, coordToken: string) => {
          setToken(coordToken);
          setGroupId(newGroupId);
          localStorage.setItem('otw_trip_token', coordToken);
          localStorage.setItem('otw_trip_group_id', newGroupId);
          // Refresh user trips list
          if (session?.user?.email) {
            fetch('/api/user/trips')
              .then((res) => (res.ok ? res.json() : { trips: [] }))
              .then((data) => {
                if (data.trips && Array.isArray(data.trips)) setUserTrips(data.trips);
              })
              .catch(console.warn);
          }
          router.push(`/?token=${coordToken}`);
        }}
      />
    </div>
  );
}

export default function HomeDashboard() {
  return (
    <Suspense fallback={<SplashScreen />}>
      <DashboardContent />
    </Suspense>
  );
}
