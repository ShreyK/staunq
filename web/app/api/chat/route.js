import { StreamingTextResponse } from 'ai';

import { ChatOpenAI } from 'langchain/chat_models/openai';
import { BytesOutputParser } from 'langchain/schema/output_parser';
import { PromptTemplate } from 'langchain/prompts';

export const runtime = 'edge';

/**
 * Basic memory formatter that stringifies and passes
 * message history directly into the model.
 */
const formatMessage = (message) => {
  return `${message.role}: ${message.content}`;
};

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

/*
 * This handler initializes and calls a simple chain with a prompt,
 * chat model, and output parser. See the docs for more information:
 *
 * https://js.langchain.com/docs/guides/expression_language/cookbook#prompttemplate--llm--outputparser
 */
export async function POST(req) {
  const body = await req.json();
  const messages = body.messages ?? [];
  const symbol = body.symbol
  const trades = body.trades
  const bids = body.bids
  const asks = body.asks

  const TEMPLATE = `You are a finance educator.
You know everything about daytrading, traditional finance, and decentralized finance, all of the different indicators within technical analysis and advanced techniques such as wycoff strategies, accumulation and distribution, supply and demand. 

You have the following data given to you for every request based on the current asset the user is viewing.
- Symbol
- Trades
- Bids
- Asks

You have the ability to give predictions for the movement of the current asset with given Symbol, you can do so 
based on the historical data in the trades and the current bids and asks for the symbol.
You should help the user in figuring out if the current symbol is moving towards the buy side or the sell side liquidity.
Provide actual values based on the bids or asks and the current momentum based on the historical trades.
The data should update every 5 seconds so you can try to help predict based on the timeline the user prompts for.
If no timeline is given assume the user is asking for the next minute.
Keep the answer very breif. Sound confident. Provide actual price values for the prediction basedd on the current data.
If the user gives a specific date/time, use the first element in the TRADES array to find the current time and convert it to the users current locale timezone

The term "bid and ask" (also known as "bid and offer") refers to a two-way price quotation that indicates the best potential price at which an asset can be sold and bought at a given point in time.
The bid price represents the maximum price that a buyer is willing to pay for a share of stock or other asset. The ask price represents the minimum price that a seller is willing to take for that same asset.
A trade or transaction occurs when a buyer in the market is willing to pay the best offer available—or is willing to sell at the highest bid.
The difference between bid and ask prices, or the spread, is a key indicator of the liquidity of the asset. In general, the smaller the spread, the better the liquidity.


=========================================

TRADES Documentation
The trades object holds an array of values with the following candlestick parameters

Parameter	Format	Required	Default	Description
open, high, low, close	Floating point	Yes		Open, High, Low, Close candlestick values for the symbol
time	Floating point	Yes		Time value in UTC

=========================================

PRICEQ Documentation
The PriceQ is used in the bids and asks arrays within the orderbook. it holds the price and the quantity of the bid/ask.
There is a minimum threshold of 10.0 for the quantity of any asset within the orderbook.

Parameter	Format	Required	Default	Description
price	Floating point	Yes		Price for the bid or ask
quantity	Floating point	Yes		Quantity in the current symbol for the bid or ask

=========================================

BIDS Documentation
The bids holds an array of PriceQ values which show the liquidity on the buy side

=========================================

ASKS Documentation
The asks or asks holds an array of PriceQ values which which show the liquidity on the sell side

=========================================


 
Current conversation:
{chat_history}

Current Asset:
${symbol}

Current trades:
${trades}

Current bids in the orderbook:
${bids}
 
Current asks in the orderbook:
${asks}

User: {input}
AI:`;
  const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
  const currentMessageContent = messages[messages.length - 1].content;

  const prompt = PromptTemplate.fromTemplate(TEMPLATE);
  /**
   * See a full list of supported models at:
   * https://js.langchain.com/docs/modules/model_io/models/
   */

  const model = new ChatOpenAI({
    openAIApiKey: OPENAI_API_KEY,
    temperature: 0.8,
  });

  /**
   * Chat models stream message chunks rather than bytes, so this
   * output parser handles serialization and encoding.
   */
  const outputParser = new BytesOutputParser();

  /*
   * Can also initialize as:
   *
   * import { RunnableSequence } from "langchain/schema/runnable";
   * const chain = RunnableSequence.from([prompt, model, outputParser]);
   */
  const chain = prompt.pipe(model).pipe(outputParser);

  const stream = await chain.stream({
    chat_history: formattedPreviousMessages.join('\n'),
    input: currentMessageContent,
  });

  return new StreamingTextResponse(stream);
}