"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Loader2, RefreshCw, Castle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useSocket } from "@/hooks/useSocket";
import { MAX_PLAYERS } from "@/lib/game/constants";

interface PublicLobby {
  code: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
}

export default function PublicPartiesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userId = session?.user?.id;
  const { emit } = useSocket(userId);

  const [lobbies, setLobbies] = useState<PublicLobby[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");

  const fetchPublicLobbies = async () => {
    setIsLoading(true);
    const result = await emit<{ success: boolean; lobbies: PublicLobby[] }>("lobby:listPublic", {});
    setLobbies(result?.lobbies ?? []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPublicLobbies();
    const interval = setInterval(fetchPublicLobbies, 8000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const joinLobby = (code: string) => {
    if (status === "unauthenticated") {
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(`/join/${code}`)}`);
      return;
    }
    router.push(`/join/${code}`);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl text-cream">Public Parties</h1>
          <p className="text-cream/50 text-sm">Open Mini-Clue lobbies waiting for players</p>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchPublicLobbies} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="rounded-xl bg-mansion-card border border-cream/10 p-4 mb-6">
        <p className="text-xs text-cream/45 mb-2 uppercase tracking-wide">Join with code</p>
        <div className="flex gap-2">
          <Input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            className="font-mono tracking-widest text-center"
          />
          <Button
            variant="gold"
            disabled={joinCode.length < 6}
            onClick={() => joinLobby(joinCode)}
          >
            Join
          </Button>
        </div>
      </div>

      {isLoading && lobbies.length === 0 ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      ) : lobbies.length === 0 ? (
        <div className="text-center py-12 rounded-xl bg-mansion-card/50 border border-cream/10">
          <Castle className="w-10 h-10 text-gold/50 mx-auto mb-3" />
          <p className="text-cream/50 text-sm">No public parties right now</p>
          <Link href="/lobby">
            <Button variant="gold" size="sm" className="mt-4">
              Create one
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {lobbies.map((lobby) => (
            <button
              key={lobby.code}
              type="button"
              onClick={() => joinLobby(lobby.code)}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-mansion-card border border-cream/10 hover:border-gold/30 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-gold/15 flex items-center justify-center font-mono text-gold font-bold text-sm">
                {lobby.code.slice(0, 3)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-cream font-medium truncate">{lobby.hostName}&apos;s party</p>
                <p className="text-cream/45 text-xs flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {lobby.playerCount}/{lobby.maxPlayers} · Mini-Clue
                </p>
              </div>
              <span className="font-mono text-gold tracking-wider">{lobby.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
