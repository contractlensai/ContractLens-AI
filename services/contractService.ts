import { supabase } from './supabaseClient';
import { ContractAuditResult, RedFlag, AuditRecord } from '../types';

export const contractService = {
    async saveAudit(userId: string, title: string, result: ContractAuditResult, privacyMode = false, contractText?: string): Promise<string> {
        // Ensure the request is performed by the authenticated user (RLS)
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        const user = userData.user;
        if (!user) throw new Error('User not authenticated');

        if (userId && userId !== user.id) {
            throw new Error('Authenticated user does not match provided userId');
        }

        // 1. Insert into contracts table using the authenticated user's id
        const { data: contractData, error: contractError } = await supabase
            .from('contracts')
            .insert({
                user_id: user.id,
                title: title,
                contract_text: contractText || result.summary || '',
                privacy_mode: privacyMode,
            })
            .select()
            .single();

        if (contractError) throw contractError;

        const contractId = contractData.id as string;

        // 2. Insert into risks table
        if (result.redFlags && result.redFlags.length > 0) {
            const risksToInsert = result.redFlags.map((flag: RedFlag) => ({
                contract_id: contractId,
                clause_text: flag.clause_text,
                risk_type: flag.risk_type,
                severity: flag.severity,
                suggested_fix: flag.suggested_fix
            }));

            const { error: risksError } = await supabase
                .from('risks')
                .insert(risksToInsert);

            if (risksError) throw risksError;
        }

        return contractId;
    },

    // Development helper to test inserting a contract using the current authenticated user (respects RLS)
    async testSupabaseInsert() {
        try {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;
            const user = userData.user;
            if (!user) {
                console.error('No authenticated user found — please login first');
                return;
            }

            const { data, error } = await supabase.from('contracts').insert({
                user_id: user.id,
                title: 'Test Contract',
                contract_text: 'This is a Supabase connection test',
                privacy_mode: false,
            }).select().single();

            if (error) {
                console.error('Supabase insert failed:', error.message || error);
                return;
            }

            console.log('Inserted contract id:', data.id);
            return data;
        } catch (err: any) {
            console.error('testSupabaseInsert error:', err.message || err);
            throw err;
        }
    },

    async getUserContracts(userId: string) {
        const { data, error } = await supabase
            .from('contracts')
            .select(`
        *,
        risks (*)
      `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getStats(userId: string) {
        const { data: contracts, error: contractError } = await supabase
            .from('contracts')
            .select('id, health_score')
            .eq('user_id', userId);

        if (contractError) throw contractError;

        const { data: risks, error: riskError } = await supabase
            .from('risks')
            .select('id', { count: 'exact' })
            .in('contract_id', contracts?.map(c => c.id) || []);

        if (riskError) throw riskError;

        const totalContracts = contracts?.length || 0;
        const totalRisks = risks?.length || 0;
        const avgHealthScore = totalContracts > 0
            ? Math.round(contracts.reduce((acc, c) => acc + c.health_score, 0) / totalContracts)
            : 0;

        return {
            totalContracts,
            totalRisks,
            avgHealthScore,
            timeSaved: totalContracts * 45 // 45 mins per contract
        };
    }
};
