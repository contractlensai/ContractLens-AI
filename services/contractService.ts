import { supabase } from './supabaseClient';
import { ContractAuditResult, RedFlag, AuditRecord } from '../types';

export const contractService = {
    async saveAudit(userId: string, title: string, result: ContractAuditResult): Promise<string> {
        // 1. Insert into contracts table
        const { data: contractData, error: contractError } = await supabase
            .from('contracts')
            .insert({
                user_id: userId,
                contract_type: result.contract_type || 'Unknown',
                health_score: result.healthScore,
                summary: result.summary,
            })

            .select()
            .single();

        if (contractError) throw contractError;

        const contractId = contractData.id;

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
