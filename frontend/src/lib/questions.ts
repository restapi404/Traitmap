export interface Question {
  position: number;
  text: string;
  dimension: "EI" | "SN" | "TF" | "JP";
  direction: "positive" | "negative";
}

export const questions: Question[] = [
  // EI
  { position: 1,  dimension: "EI", direction: "positive",  text: "You feel energised after spending time with a large group of people." },
  { position: 2,  dimension: "EI", direction: "negative",  text: "After a long social event, you need time alone to recharge." },
  { position: 3,  dimension: "EI", direction: "positive",  text: "You find it easy to strike up a conversation with someone you have just met." },
  { position: 4,  dimension: "EI", direction: "negative",  text: "You prefer working on a task alone rather than in a group." },
  { position: 5,  dimension: "EI", direction: "positive",  text: "You enjoy being the centre of attention in social situations." },
  { position: 6,  dimension: "EI", direction: "negative",  text: "You tend to think things through internally before sharing your ideas." },
  { position: 7,  dimension: "EI", direction: "positive",  text: "You have a wide circle of friends and enjoy meeting new people regularly." },
  { position: 8,  dimension: "EI", direction: "negative",  text: "You find small talk at parties draining rather than enjoyable." },
  { position: 9,  dimension: "EI", direction: "positive",  text: "You often think out loud, talking through problems with others." },
  { position: 10, dimension: "EI", direction: "negative",  text: "You prefer deep one-on-one conversations over group discussions." },
  { position: 11, dimension: "EI", direction: "positive",  text: "You get bored quickly when you have to spend too much time alone." },
  { position: 12, dimension: "EI", direction: "negative",  text: "You feel most productive when you have uninterrupted quiet time." },
  { position: 13, dimension: "EI", direction: "positive",  text: "You enjoy meeting new people and building new connections." },
  { position: 14, dimension: "EI", direction: "negative",  text: "You find it difficult to open up to people you have only recently met." },
  { position: 15, dimension: "EI", direction: "positive",  text: "You often take the initiative in social situations, introducing people or starting conversations." },
  // SN
  { position: 16, dimension: "SN", direction: "positive",  text: "You prefer working with concrete facts and real data over abstract theories." },
  { position: 17, dimension: "SN", direction: "negative",  text: "You often find yourself thinking about what could be rather than what currently is." },
  { position: 18, dimension: "SN", direction: "positive",  text: "You trust hands-on experience more than theoretical knowledge." },
  { position: 19, dimension: "SN", direction: "negative",  text: "You enjoy exploring ideas even when they have no immediate practical use." },
  { position: 20, dimension: "SN", direction: "positive",  text: "You pay close attention to specific details before starting a task." },
  { position: 21, dimension: "SN", direction: "negative",  text: "You are more interested in the big picture than in the specific details." },
  { position: 22, dimension: "SN", direction: "positive",  text: "You prefer step-by-step instructions to open-ended problem solving." },
  { position: 23, dimension: "SN", direction: "negative",  text: "You find patterns and connections between seemingly unrelated things quickly." },
  { position: 24, dimension: "SN", direction: "positive",  text: "You find it easier to describe something in literal terms than through metaphors." },
  { position: 25, dimension: "SN", direction: "negative",  text: "You often rely on gut feeling or intuition when making decisions." },
  { position: 26, dimension: "SN", direction: "positive",  text: "You prefer tried-and-tested methods over experimental approaches." },
  { position: 27, dimension: "SN", direction: "negative",  text: "You enjoy brainstorming unconventional ideas, even impractical ones." },
  { position: 28, dimension: "SN", direction: "positive",  text: "When learning something new, you like clear examples before abstract concepts." },
  { position: 29, dimension: "SN", direction: "negative",  text: "You often think several steps ahead, imagining future possibilities." },
  { position: 30, dimension: "SN", direction: "positive",  text: "You trust what you can directly observe over speculation or theory." },
  // TF
  { position: 31, dimension: "TF", direction: "positive",  text: "When making a decision, logic and objective analysis matter more to you than how it affects feelings." },
  { position: 32, dimension: "TF", direction: "negative",  text: "You find it important to consider how your decisions impact the people involved." },
  { position: 33, dimension: "TF", direction: "positive",  text: "You believe it is more important to be honest than to be tactful." },
  { position: 34, dimension: "TF", direction: "negative",  text: "You find it easy to sense when someone is upset, even if they have not said anything." },
  { position: 35, dimension: "TF", direction: "positive",  text: "You find debates and intellectual arguments stimulating rather than uncomfortable." },
  { position: 36, dimension: "TF", direction: "negative",  text: "You prioritise maintaining harmony in a group over winning an argument." },
  { position: 37, dimension: "TF", direction: "positive",  text: "You tend to evaluate situations by their outcomes and effectiveness, not by feelings." },
  { position: 38, dimension: "TF", direction: "negative",  text: "You often put others needs before your own without being asked." },
  { position: 39, dimension: "TF", direction: "positive",  text: "You find it easy to stay detached and objective even in emotional situations." },
  { position: 40, dimension: "TF", direction: "negative",  text: "A cold or indifferent response from someone you care about affects you deeply." },
  { position: 41, dimension: "TF", direction: "positive",  text: "You would rather deliver difficult feedback directly than soften it and risk being misunderstood." },
  { position: 42, dimension: "TF", direction: "negative",  text: "You feel uncomfortable in environments where people treat each other coldly or dismissively." },
  { position: 43, dimension: "TF", direction: "positive",  text: "You believe rules and fairness should apply equally to everyone, regardless of circumstance." },
  { position: 44, dimension: "TF", direction: "negative",  text: "You find it natural to offer emotional support before trying to solve someone's problem." },
  { position: 45, dimension: "TF", direction: "positive",  text: "When reviewing someone's work, you focus on what is incorrect rather than how they might feel about it." },
  // JP
  { position: 46, dimension: "JP", direction: "positive",  text: "You prefer to have things planned and settled rather than open and flexible." },
  { position: 47, dimension: "JP", direction: "negative",  text: "You enjoy being spontaneous and going with the flow rather than following a schedule." },
  { position: 48, dimension: "JP", direction: "positive",  text: "You feel stressed when things are left unresolved or incomplete." },
  { position: 49, dimension: "JP", direction: "negative",  text: "You often start a new project before finishing your current one." },
  { position: 50, dimension: "JP", direction: "positive",  text: "You make to-do lists and consistently follow them." },
  { position: 51, dimension: "JP", direction: "negative",  text: "You work best under pressure and often produce your best work close to a deadline." },
  { position: 52, dimension: "JP", direction: "positive",  text: "You prefer to make decisions quickly and move on rather than keep options open." },
  { position: 53, dimension: "JP", direction: "negative",  text: "You enjoy adapting your plans when new information or opportunities arise." },
  { position: 54, dimension: "JP", direction: "positive",  text: "You find it satisfying to complete a task and check it off your list." },
  { position: 55, dimension: "JP", direction: "negative",  text: "You often feel that strict rules and schedules limit your creativity and freedom." },
  { position: 56, dimension: "JP", direction: "positive",  text: "You like your living or working space to be organised and tidy." },
  { position: 57, dimension: "JP", direction: "negative",  text: "You prefer to keep your options open rather than commit to a specific plan early." },
  { position: 58, dimension: "JP", direction: "positive",  text: "You find it easier to focus when you have a clear agenda or schedule." },
  { position: 59, dimension: "JP", direction: "negative",  text: "You find strict routines feel suffocating over time." },
  { position: 60, dimension: "JP", direction: "positive",  text: "You like to resolve disagreements or open decisions promptly rather than leaving them hanging." },
];

export const SCALE_LABELS = [
  { value: 1, label: "Strongly agree" },
  { value: 2, label: "Agree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Disagree" },
  { value: 5, label: "Strongly disagree" },
];
