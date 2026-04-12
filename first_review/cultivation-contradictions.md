# Cultivation Data Contradictions

Summary: Seven contradictions found where different files give the user conflicting numbers for the same parameter.

## 1. Spider Mites RH vs Late-Flower RH (previously flagged)

rules-advice.js:343-347 (advice-mites-raise-rh): "Raise humidity above 50%" with severity alert. grow-knowledge.js:68-69 (late-flower dayRH): 35-45%. edge-case-knowledge-supplemental.js:373-381 correctly identifies this as "the most dangerous direct contradiction" and blocks it. However, the advice rule still fires because it has no stage filter. The supplemental edge case only fires when specific plantFlags are present.

## 2. Drying Temperature: Three Different Ranges

stage-content.js:330: "Target 15-18C." stage-rules.js:308: DRYING_TARGETS temp min:15, max:21. knowledge-articles.js:382: "18-21C." Range endpoints: 15-18 vs 15-21 vs 18-21. Fix: align to 15-18C for quality, 15-21C as acceptable range.

## 3. Seedling VPD: Two Different Ranges

stage-content.js:43: "VPD 0.6-0.9 kPa." grow-knowledge.js:28: vpdRange min:0.4, max:0.8. knowledge-articles.js:23: "0.4-0.8 kPa." Stage-content says 0.6-0.9; the data layer says 0.4-0.8. Overlap is only 0.6-0.8.

## 4. Harvest Amber Percentage

stage-content.js:314,317: "70-80% cloudy with 20-30% amber for balance." knowledge-articles.js:356: "10-20% amber for balanced effect." These tell the user different things. The difference (10-20% vs 20-30% amber) represents 7-14 days of additional ripening.

## 5. Epsom Foliar Timing

rules-advice.js:293: "spray leaves at lights-off." edge-case-knowledge-supplemental.js:434-435: "Applying Mg-rich foliar at lights-off reduces absorption efficiency by 40-60%" and recommends 30 min before lights-on. Direct contradiction on the same treatment.

## 6. Cure Burp Schedule: Week 1

stage-content.js:369 and stage-rules.js:177: 3x daily in week 1. knowledge-articles.js:395: "first 2 weeks, open jars for 15 minutes twice daily." Frequency disagrees (3x vs 2x) and window disagrees (week 1 vs first 2 weeks).

## 7. Late-Flower RH for Terpenes vs Botrytis Prevention

knowledge-articles.js:449 (terpene-max): "maintain humidity at 50-55% RH in final weeks." grow-knowledge.js:68 (late-flower dayRH): 35-45%. stage-content.js:258: "Hold RH at 45-50%." Three different ranges for the same stage. Terpene-max at 50-55% conflicts with botrytis prevention at 35-45%.
