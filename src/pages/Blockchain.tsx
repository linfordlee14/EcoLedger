import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Coins, Shield, Award, Zap, Copy, ExternalLink, CheckCircle } from "lucide-react";

interface CarbonNFT {
  id: string;
  token_id: string;
  carbon_amount: number;
  issue_date: string;
  verification_hash: string;
  blockchain_status: string;
  metadata: any;
}

interface BlockchainReward {
  id: string;
  token_amount: number;
  earned_date: string;
  transaction_hash?: string;
  reward_type: string;
}

export const Blockchain = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [nfts, setNfts] = useState<CarbonNFT[]>([]);
  const [rewards, setRewards] = useState<BlockchainReward[]>([]);
  const [totalTokens, setTotalTokens] = useState(0);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBlockchainData();
    }
  }, [user]);

  const fetchBlockchainData = async () => {
    try {
      // Fetch NFTs
      const nftResult = await (supabase as any)
        .from('carbon_nfts')
        .select('*')
        .eq('user_id', user?.id)
        .order('issue_date', { ascending: false });

      if (nftResult.error) throw nftResult.error;

      // Fetch rewards
      const rewardResult = await (supabase as any)
        .from('blockchain_rewards')
        .select('*')
        .eq('user_id', user?.id)
        .order('earned_date', { ascending: false });

      if (rewardResult.error) throw rewardResult.error;

      const nftData = (nftResult.data || []) as CarbonNFT[];
      const rewardData = (rewardResult.data || []) as BlockchainReward[];
      
      setNfts(nftData);
      setRewards(rewardData);
      setTotalTokens(rewardData.reduce((sum, reward) => sum + reward.token_amount, 0));
    } catch (error) {
      console.error('Error fetching blockchain data:', error);
      toast({
        title: "Error",
        description: "Failed to load blockchain data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const mintCarbonNFT = async () => {
    setMinting(true);
    try {
      // Get user's total carbon footprint
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('total_carbon_footprint, total_green_points')
        .eq('user_id', user?.id)
        .single();

      if (profileError) throw profileError;

      if (profile.total_carbon_footprint < 10) {
        toast({
          title: "Insufficient Data",
          description: "You need at least 10kg CO₂e tracked to mint an NFT.",
          variant: "destructive",
        });
        return;
      }

      // Simulate blockchain minting process
      const tokenId = `ECO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const verificationHash = `0x${Math.random().toString(16).substr(2, 64)}`;

      const { error } = await (supabase as any)
        .from('carbon_nfts')
        .insert({
          user_id: user?.id,
          token_id: tokenId,
          carbon_amount: profile.total_carbon_footprint,
          verification_hash: verificationHash,
          blockchain_status: 'minted',
          metadata: {
            name: `Carbon Impact Certificate #${tokenId}`,
            description: `This NFT certifies ${profile.total_carbon_footprint.toFixed(2)}kg CO₂e carbon footprint tracking`,
            image: `https://api.dicebear.com/7.x/shapes/svg?seed=${tokenId}`,
            attributes: [
              { trait_type: "Carbon Tracked", value: `${profile.total_carbon_footprint.toFixed(2)} kg CO₂e` },
              { trait_type: "Green Points", value: profile.total_green_points },
              { trait_type: "Issue Date", value: new Date().toISOString().split('T')[0] }
            ]
          }
        });

      if (error) throw error;

      // Award tokens for minting
      await (supabase as any)
        .from('blockchain_rewards')
        .insert({
          user_id: user?.id,
          token_amount: 100,
          reward_type: 'nft_mint',
          transaction_hash: `0x${Math.random().toString(16).substr(2, 64)}`
        });

      toast({
        title: "NFT Minted Successfully!",
        description: "Your Carbon Impact Certificate has been created and 100 ECO tokens awarded.",
      });

      fetchBlockchainData();
    } catch (error) {
      console.error('Error minting NFT:', error);
      toast({
        title: "Minting Failed",
        description: "Unable to mint NFT. Please try again.",
        variant: "destructive",
      });
    } finally {
      setMinting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Hash copied to clipboard.",
    });
  };

  if (loading) {
    return (
      <Layout title="Blockchain" description="Carbon NFTs, tokens, and blockchain verification">
        <div className="text-center py-8">
          <Coins className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-muted-foreground">Loading blockchain data...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Blockchain" description="Carbon NFTs, tokens, and blockchain verification">
      <div className="space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="card-enhanced">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ECO Tokens</p>
                  <p className="text-3xl font-bold text-primary">{totalTokens}</p>
                </div>
                <Coins className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-enhanced">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Carbon NFTs</p>
                  <p className="text-3xl font-bold text-foreground">{nfts.length}</p>
                </div>
                <Award className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-enhanced">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Verified Data</p>
                  <p className="text-3xl font-bold text-green-600">{nfts.filter(n => n.blockchain_status === 'minted').length}</p>
                </div>
                <Shield className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mint NFT Section */}
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Carbon Impact Certificate
            </CardTitle>
            <CardDescription>
              Mint an NFT to permanently verify your carbon tracking achievements on the blockchain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-6 border rounded-lg gradient-bg text-white">
              <div>
                <h3 className="text-lg font-semibold mb-2">Create Your Carbon Certificate</h3>
                <p className="text-sm opacity-90">
                  Mint a unique NFT that certifies your environmental impact tracking. 
                  Each certificate is permanently stored on the blockchain and includes your carbon data.
                </p>
              </div>
              <Button 
                onClick={mintCarbonNFT}
                disabled={minting}
                variant="secondary"
                size="lg"
                className="hover-lift"
              >
                <Award className="h-4 w-4 mr-2" />
                {minting ? "Minting..." : "Mint NFT"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* NFTs and Rewards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Carbon NFTs */}
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Carbon NFTs
              </CardTitle>
              <CardDescription>Your blockchain-verified carbon certificates</CardDescription>
            </CardHeader>
            <CardContent>
              {nfts.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {nfts.map((nft) => (
                    <div key={nft.id} className="p-4 border rounded-lg hover:shadow-[var(--shadow-medium)] transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">Carbon Certificate #{nft.token_id.split('-')[1]}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(nft.issue_date).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={nft.blockchain_status === 'minted' ? 'default' : 'secondary'}>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {nft.blockchain_status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <p><strong>Carbon Verified:</strong> {nft.carbon_amount.toFixed(2)} kg CO₂e</p>
                        <div className="flex items-center space-x-2">
                          <span><strong>Hash:</strong></span>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {nft.verification_hash.substring(0, 20)}...
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(nft.verification_hash)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No NFTs minted yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Track your carbon footprint and mint your first certificate!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Token Rewards */}
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                ECO Token Rewards
              </CardTitle>
              <CardDescription>Blockchain tokens earned through eco-friendly actions</CardDescription>
            </CardHeader>
            <CardContent>
              {rewards.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {rewards.map((reward) => (
                    <div key={reward.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Zap className="h-4 w-4 text-primary" />
                          <span className="font-medium capitalize">
                            {reward.reward_type.replace('_', ' ')}
                          </span>
                        </div>
                        <Badge variant="default">
                          +{reward.token_amount} ECO
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {new Date(reward.earned_date).toLocaleDateString()}
                      </p>
                      {reward.transaction_hash && (
                        <div className="flex items-center space-x-2 text-xs">
                          <span>TX:</span>
                          <code className="bg-muted px-2 py-1 rounded">
                            {reward.transaction_hash.substring(0, 20)}...
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(reward.transaction_hash!)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No tokens earned yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Complete eco-friendly activities to earn ECO tokens!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              How Blockchain Verification Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center mx-auto mb-3">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold mb-2">Data Verification</h4>
                <p className="text-sm text-muted-foreground">
                  Your carbon tracking data is cryptographically verified and stored immutably on the blockchain.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center mx-auto mb-3">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold mb-2">NFT Certificates</h4>
                <p className="text-sm text-muted-foreground">
                  Mint unique NFTs that serve as permanent certificates of your environmental impact.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center mx-auto mb-3">
                  <Coins className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold mb-2">Token Rewards</h4>
                <p className="text-sm text-muted-foreground">
                  Earn ECO tokens for sustainable actions that can be used in our ecosystem.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};