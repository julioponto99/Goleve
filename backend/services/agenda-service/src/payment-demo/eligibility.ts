import { ApiError } from '../config/errors';
import { AppointmentEligibility, EligibilityInput, EligibilityDecision } from '../professional/eligibility';
import { DemoClient, DemoConfig, Quote, assertDemo, validQuote } from './protocol';
export class DemoEligibility implements AppointmentEligibility {
  readonly client:DemoClient;
  constructor(readonly config:DemoConfig,database:string){assertDemo(config,database);this.client=new DemoClient(config);}
  async check(input:EligibilityInput):Promise<EligibilityDecision>{
    const d=await this.client.call<EligibilityDecision>('professional','eligibility',input),now=Date.now(),checked=Date.parse(d?.checkedAtUtc),until=Date.parse(d?.validUntilUtc);
    if(!d||d.authority!=='synthetic'||!d.eligible||!d.canOfferAppointment||d.capabilityId!==input.capabilityId||(input.professionalId&&d.professionalId!==input.professionalId)
      ||!/^[a-f0-9]{24}$/.test(d.professionalId)||!/^[a-f0-9]{24}$/.test(d.professionalAuthUserId)||!['personal_training','nutrition'].includes(d.relationshipKind)||!Array.isArray(d.serviceModes)||d.serviceModes.some(x=>!['online','in_person','home_visit'].includes(x))
      ||typeof d.relationshipAccepted!=='boolean'||!Number.isFinite(checked)||!Number.isFinite(until)||checked>now+1000||checked<now-15000||until<=now||until-checked>15000)throw new ApiError(404,'DEMO_PROFESSIONAL_INELIGIBLE','Current authenticated synthetic eligibility required');
    return d;
  }
  async quote(actorId:string,serviceId:string,professionalId:string,capabilityId:string,durationMinutes:number,quoteId?:string){
    const expected={serviceId,professionalId,capabilityId,durationMinutes};const q=await this.client.call<Quote>('professional','quote',{actorId,...expected,...(quoteId?{quoteId}:{})});return validQuote(q,expected);
  }
}
