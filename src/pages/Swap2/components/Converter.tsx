import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, CircleQuestionMarkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAllTokens, useCurrency } from '../../../hooks/Tokens';
import { useSwapState, useSwapActionHandlers, useDerivedSwapInfo } from '../../../state/swap/hooks';
import { useActiveWeb3React } from '../../../hooks';
import { maxAmountSpend } from '../../../utils/maxAmountSpend';
import { Field } from '../../../state/swap/actions';
import { useSwapCallback } from '../../../hooks/useSwapCallback';
import { computeTradePriceBreakdown } from '../../../utils/prices';
import { useUserSlippageTolerance } from '../../../state/user/hooks';

const Converter = () => {
    // Real token and swap logic
    const allTokens = useAllTokens();
    const { account } = useActiveWeb3React();
    const { independentField, typedValue, recipient } = useSwapState();
    const { onCurrencySelection, onUserInput } = useSwapActionHandlers();
    const { currencies, currencyBalances, inputError, v2Trade: trade } = useDerivedSwapInfo();
    const [allowedSlippage] = useUserSlippageTolerance();
    const [slippageTolerance, setSlippageTolerance] = useState(allowedSlippage / 100);
    const [isFromDropdownOpen, setIsFromDropdownOpen] = useState(false);
    const [isToDropdownOpen, setIsToDropdownOpen] = useState(false);
    const fromDropdownRef = useRef<HTMLDivElement>(null);
    const toDropdownRef = useRef<HTMLDivElement>(null);

    // Token objects
    const fromToken = currencies && Field.INPUT in currencies ? currencies[Field.INPUT] : undefined;
    const toToken = currencies && Field.OUTPUT in currencies ? currencies[Field.OUTPUT] : undefined;
    const fromBalance = currencyBalances && Field.INPUT in currencyBalances && currencyBalances[Field.INPUT]?.toExact ? currencyBalances[Field.INPUT].toExact() : '0';
    const toBalance = currencyBalances && Field.OUTPUT in currencyBalances && currencyBalances[Field.OUTPUT]?.toExact ? currencyBalances[Field.OUTPUT].toExact() : '0';
    // Show calculated output value for the opposite field
    let fromAmount = '';
    let toAmount = '';
    if (independentField === Field.INPUT) {
        fromAmount = typedValue;
        // If trade exists, show the real output amount
        toAmount = trade && trade.outputAmount && typeof trade.outputAmount.toSignificant === 'function' ? trade.outputAmount.toSignificant(8) : '';
    } else {
        toAmount = typedValue;
        fromAmount = trade && trade.inputAmount && typeof trade.inputAmount.toSignificant === 'function' ? trade.inputAmount.toSignificant(8) : '';
    }
    const maxAmountInput = currencyBalances && Field.INPUT in currencyBalances && currencyBalances[Field.INPUT] ? maxAmountSpend(currencyBalances[Field.INPUT]) : undefined;
    const maxAmountOutput = currencyBalances && Field.OUTPUT in currencyBalances && currencyBalances[Field.OUTPUT] ? maxAmountSpend(currencyBalances[Field.OUTPUT]) : undefined;
    const { callback: swapCallback } = useSwapCallback(trade, allowedSlippage, recipient, 0);

    // Dropdown token lists
    const tokenList = allTokens ? Object.values(allTokens) : [];
    const fromTokenList = tokenList.filter(t => !toToken || t.symbol !== toToken?.symbol);
    const toTokenList = tokenList.filter(t => !fromToken || t.symbol !== fromToken?.symbol);

    // Token logo helpers
    const getTokenLogo = (token: any) => token?.logoURI || '/images/stock-1.svg';
    const getTokenSymbol = (token: any) => token?.symbol || '';
    const getTokenName = (token: any) => token?.name || '';

    // Handle token selection
    const handleTokenSelect = (token: any, isFrom: boolean = true) => {
        onCurrencySelection(isFrom ? Field.INPUT : Field.OUTPUT, token);
        if (isFrom) setIsFromDropdownOpen(false);
        else setIsToDropdownOpen(false);
    };

    // Handle amount input
    const handleAmountChange = (value: string, isFrom: boolean = true) => {
        onUserInput(isFrom ? Field.INPUT : Field.OUTPUT, value);
    };

    // Handle max amount
    const handleMaxAmount = (isFrom: boolean = true) => {
        if (isFrom && maxAmountInput) onUserInput(Field.INPUT, maxAmountInput.toExact());
        if (!isFrom && maxAmountOutput) onUserInput(Field.OUTPUT, maxAmountOutput.toExact());
    };

    // Swap tokens (switch input/output)
    const handleSwapTokens = () => {
        if (toToken) {
            onCurrencySelection(Field.INPUT, toToken);
        }
        if (fromToken) {
            onCurrencySelection(Field.OUTPUT, fromToken);
        }
    };

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (fromDropdownRef.current && !fromDropdownRef.current.contains(target)) {
                setIsFromDropdownOpen(false);
            }
            if (toDropdownRef.current && !toDropdownRef.current.contains(target)) {
                setIsToDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Price
    const price = trade && trade.executionPrice ? trade.executionPrice.toSignificant(8) : '-';

    return (
        <div className="hero-border mt-[100px] mb-[150px] w-full p-[3.5px] md:rounded-[40px] rounded-[20px]">
            <div className="bg-[linear-gradient(105.87deg,_rgba(0,0,0,0.2)_3.04%,_rgba(0,0,0,0)_96.05%)] relative backdrop-blur-[80px] w-full md:rounded-[40px] rounded-[20px] px-[15px] md:px-[50px] py-[20px] md:py-[60px]">
                <div className="relative z-10 border bg-[#FFFFFF66] inline-flex px-2 py-1.5 rounded-[14px] border-solid border-[#FFFFFF1A] mb-6 gap-2">
                    <Link
                        to="/swap"
                        className="rounded-[8px] bg-white text-[#2A8576] font-bold text-sm leading-[100%] px-[22px] py-[13px] cursor-pointer"
                    >
                        Exchange
                    </Link>
                    <Link
                        to="/pool"
                        className="rounded-[8px] text-black font-normal text-sm leading-[100%] px-[22px] py-[13px] cursor-pointer"
                    >
                        Pool
                    </Link>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-[25px] md:gap-[51px]">
                    {/* FROM TOKEN SECTION */}
                    <div className="flex-1 w-full">
                        <div className="bg-[#FFFFFF66] border border-solid border-[#FFFFFF1A] rounded-[12px] px-[15px] py-[18px]">
                            <div className="flex items-center justify-between font-normal text-sm leading-[18.86px] text-black mb-3">
                                <span>
                                    Availability: {parseFloat(fromBalance).toFixed(3)}
                                </span>
                                <button
                                    onClick={() => handleMaxAmount(true)}
                                    className="underline hover:text-[#3DBEA3] cursor-pointer"
                                >
                                    Max: {parseFloat(fromBalance).toFixed(3)}
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <input
                                    type="number"
                                    value={fromAmount}
                                    onChange={(e) => handleAmountChange(e.target.value, true)}
                                    placeholder="0.000"
                                    className="text-black font-bold text-[22px] leading-[31.43px] bg-transparent border-none outline-none flex-1 mr-4"
                                />
                                <div className="relative min-w-[95px]" ref={fromDropdownRef}>
                                    <button
                                        onClick={() => setIsFromDropdownOpen(!isFromDropdownOpen)}
                                        aria-expanded={isFromDropdownOpen}
                                        aria-haspopup="listbox"
                                        className="token-button w-full flex items-center cursor-pointer select-none hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors"
                                        type="button"
                                    >
                                        <img
                                            className="token-img rounded-full shadow-[0px_6px_10px_0px_#00000013] size-[23px] min-w-[23px]"
                                            alt={getTokenName(fromToken)}
                                            src={getTokenLogo(fromToken)}
                                        />
                                        <span className="token-label text-[#000000] text-[16px] font-normal text-left flex-grow ml-3 mr-8">
                                            {getTokenSymbol(fromToken)}
                                        </span>
                                        <ChevronDown
                                            className={`token-arrow transition-transform ${isFromDropdownOpen ? 'rotate-180' : ''}`}
                                        />
                                    </button>
                                    {isFromDropdownOpen && (
                                        <ul
                                            className="token-list absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg max-h-48 overflow-auto text-[13px] font-normal text-black"
                                            role="listbox"
                                            tabIndex={-1}
                                        >
                                            {fromTokenList.map((token: any) => (
                                                <li
                                                    key={token.symbol}
                                                    onClick={() => handleTokenSelect(token, true)}
                                                    className="token-item cursor-pointer select-none relative py-2 pl-3 pr-9 flex items-center hover:bg-gray-100"
                                                    role="option"
                                                    tabIndex={0}
                                                >
                                                    <img
                                                        alt={getTokenName(token)}
                                                        className="w-6 h-6 mr-2"
                                                        height="24"
                                                        src={getTokenLogo(token)}
                                                        width="24"
                                                    />
                                                    {getTokenSymbol(token)}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4 flex gap-3 percentage-redio-buttons">
                                {[25, 50, 75, 100].map((percent) => (
                                    <button
                                        key={percent}
                                        type="button"
                                        className={`flex-1 bg-[#FFFFFF66] border border-solid border-[#FFFFFF1A] rounded-md py-[5px] md:py-[11px] text-[16px] md:text-base font-semibold text-[#80888A] md:text-[#1D3B5E] text-center hover:bg-[#3DBEA3] hover:text-white transition-colors`}
                                        onClick={() => {
                                            if (maxAmountInput) {
                                                const value = (parseFloat(maxAmountInput.toExact()) * percent / 100).toString();
                                                handleAmountChange(value, true);
                                            }
                                        }}
                                    >
                                        {percent}%
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* SWAP BUTTON */}
                    <div>
                        <button
                            onClick={handleSwapTokens}
                            className="hover:bg-gray-100 p-2 rounded-full transition-colors"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="28"
                                height="29"
                                fill="none"
                            >
                                <path
                                    fill="#000"
                                    d="M19.876.5H8.138C3.04.5 0 3.538 0 8.634v11.718c0 5.11 3.04 8.148 8.138 8.148h11.724C24.96 28.5 28 25.462 28 20.366V8.634C28.014 3.538 24.974.5 19.876.5Zm-7.284 21c0 .14-.028.266-.084.406a1.095 1.095 0 0 1-.574.574 1.005 1.005 0 0 1-.406.084 1.056 1.056 0 0 1-.743-.308l-4.132-4.13a1.056 1.056 0 0 1 0-1.484 1.057 1.057 0 0 1 1.485 0l2.34 2.338V7.5c0-.574.476-1.05 1.05-1.05.574 0 1.064.476 1.064 1.05v14Zm8.755-9.128a1.04 1.04 0 0 1-.743.308 1.04 1.04 0 0 1-.742-.308l-2.34-2.338V21.5c0 .574-.475 1.05-1.05 1.05-.574 0-1.05-.476-1.05-1.05v-14c0-.14.028-.266.084-.406.112-.252.308-.462.574-.574a.99.99 0 0 1 .798 0c.127.056.238.126.337.224l4.132 4.13c.406.42.406 1.092 0 1.498Z"
                                />
                            </svg>
                        </button>
                    </div>
                    {/* TO TOKEN SECTION */}
                    <div className="flex-1 w-full">
                        <div className="bg-[#FFFFFF66] border border-solid border-[#FFFFFF1A] rounded-[12px] px-[15px] py-[18px]">
                            <div className="flex items-center justify-between font-normal text-sm leading-[18.86px] text-black mb-3">
                                <span>
                                    Availability: {parseFloat(toBalance).toFixed(3)}
                                </span>
                                <button
                                    onClick={() => handleMaxAmount(false)}
                                    className="underline hover:text-[#3DBEA3] cursor-pointer"
                                >
                                    Max: {parseFloat(toBalance).toFixed(3)}
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <input
                                    type="number"
                                    value={toAmount}
                                    onChange={(e) => handleAmountChange(e.target.value, false)}
                                    placeholder="0.000"
                                    className="text-black font-bold text-[22px] leading-[31.43px] bg-transparent border-none outline-none flex-1 mr-4"
                                />
                                <div className="relative min-w-[95px]" ref={toDropdownRef}>
                                    <button
                                        onClick={() => setIsToDropdownOpen(!isToDropdownOpen)}
                                        aria-expanded={isToDropdownOpen}
                                        aria-haspopup="listbox"
                                        className="token-button w-full flex items-center cursor-pointer select-none hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors"
                                        type="button"
                                    >
                                        <img
                                            className="token-img rounded-full shadow-[0px_6px_10px_0px_#00000013] size-[23px] min-w-[23px]"
                                            alt={getTokenName(toToken)}
                                            src={getTokenLogo(toToken)}
                                        />
                                        <span className="token-label text-[#000000] text-[16px] font-normal text-left flex-grow ml-3 mr-8">
                                            {getTokenSymbol(toToken)}
                                        </span>
                                        <ChevronDown
                                            className={`token-arrow transition-transform ${isToDropdownOpen ? 'rotate-180' : ''}`}
                                        />
                                    </button>
                                    {isToDropdownOpen && (
                                        <ul
                                            className="token-list absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg max-h-48 overflow-auto text-[13px] font-normal text-black"
                                            role="listbox"
                                            tabIndex={-1}
                                        >
                                            {toTokenList.map((token: any) => (
                                                <li
                                                    key={token.symbol}
                                                    onClick={() => handleTokenSelect(token, false)}
                                                    className="token-item cursor-pointer select-none relative py-2 pl-3 pr-9 flex items-center hover:bg-gray-100"
                                                    role="option"
                                                    tabIndex={0}
                                                >
                                                    <img
                                                        alt={getTokenName(token)}
                                                        className="w-6 h-6 mr-2"
                                                        height="24"
                                                        src={getTokenLogo(token)}
                                                        width="24"
                                                    />
                                                    {getTokenSymbol(token)}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4 flex gap-3 percentage-redio-buttons">
                                {[25, 50, 75, 100].map((percent) => (
                                    <button
                                        key={percent}
                                        type="button"
                                        className={`flex-1 bg-[#FFFFFF66] border border-solid border-[#FFFFFF1A] rounded-md py-[5px] md:py-[11px] text-[16px] md:text-base font-semibold text-[#80888A] md:text-[#1D3B5E] text-center hover:bg-[#3DBEA3] hover:text-white transition-colors`}
                                        onClick={() => {
                                            if (maxAmountOutput) {
                                                const value = (parseFloat(maxAmountOutput.toExact()) * percent / 100).toString();
                                                handleAmountChange(value, false);
                                            }
                                        }}
                                    >
                                        {percent}%
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                {/* PRICE AND SLIPPAGE INFO */}
                <div className="mt-[36px] bg-[#FFFFFF66] border border-solid border-[#FFFFFF1A] rounded-[12px] px-[15px] py-[18px] flex items-center justify-between ">
                    <div className="flex-1 font-normal text-sm leading-[18.86px] text-black">
                        <span>Price</span>
                        <p className="text-black font-bold text-[22px] leading-[31.43px] mt-4">
                            {price}
                        </p>
                    </div>
                    <div className="flex-1 font-normal text-sm leading-[18.86px] text-black text-center">
                        <span>
                            Expiration Date:{' '}
                            {new Date(
                                Date.now() + 24 * 60 * 60 * 1000
                            ).toLocaleDateString()}
                        </span>
                        <p className="text-black font-bold text-[22px] leading-[31.43px] mt-4">
                            {getTokenSymbol(fromToken)} - {getTokenSymbol(toToken)}
                        </p>
                    </div>
                    <div className="flex-1">
                        <span className="flex items-center gap-2 justify-end">
                            Slippage Tolerance
                            <CircleQuestionMarkIcon />
                        </span>
                        <div className="flex items-center justify-end mt-4">
                            <input
                                type="number"
                                value={slippageTolerance}
                                onChange={(e) =>
                                    setSlippageTolerance(
                                        parseFloat(e.target.value) || 1
                                    )
                                }
                                className="font-bold text-[22px] leading-[31.43px] text-[#3DBEA3] bg-transparent border-none outline-none w-12 text-right"
                                min="0.1"
                                max="50"
                                step="0.1"
                            />
                            <span className="font-bold text-[22px] leading-[31.43px] text-[#3DBEA3]">
                                %
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Converter
