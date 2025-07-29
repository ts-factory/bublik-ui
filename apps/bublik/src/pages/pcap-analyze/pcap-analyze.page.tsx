import { NetPacketAnalyserContainer } from '@/bublik/features/net-analysis';

export function PcapAnalyzePage() {
	return <NetPacketAnalyserContainer fileUrl="/v2/samples/http.cap" />;
}
