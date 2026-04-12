# Cultivation Accuracy Audit

Summary: The cultivation data is substantially accurate with practitioner-grade advice. A few claims need correction or caveats.

## Outright Wrong or Misleading

- **DLI ceiling contradiction**: knowledge-articles.js:37 states "Cannabis starts showing diminishing returns above 45 DLI" while knowledge-science.js:24-36 and grow-knowledge.js:127 (mid-flower yield max: 65 DLI) correctly cite Rodriguez-Morrison 2021 showing linear yield to 78 DLI. The knowledge-article layer needs to match the science layer. The 45 DLI claim is false.

- **Neem advice fires in flower**: rules-advice.js:354-355 (id: advice-mites-spray) recommends "Neem oil the undersides" with condition `_truthy` and no stage filter. This can fire during mid-flower or late-flower when neem is dangerous. The spider-mites article correctly limits to veg stages (knowledge-articles.js:331), but the advice rule does not inherit that constraint. A grower following this advice in week 6 of flower contaminates their buds.

- **Epsom foliar timing**: rules-advice.js:293 advises "spray leaves at lights-off" for Mg correction while edge-case-knowledge-supplemental.js:433-434 correctly identifies that stomata close in the dark, reducing absorption 40-60%. The advice rule gives the opposite of best practice.

## Oversimplified for Beginners

- **Autoflower topping blanket ban**: knowledge-articles.js:300 says "no topping" flatly, strain-class-adjustments.js:46 says "never top before 5th node" (implying topping IS possible after), and myths-data.js:151 says "partially true" and acknowledges experienced growers can top early. The user gets three conflicting messages. Should be unified: "default to LST; experienced growers may top before day 21 with vigorous plants."

- **CalMag advice lacks water-source context**: grow-knowledge.js:147-152 recommends CalMag under LED across all soil stages without checking tap water hardness. edge-case-knowledge-supplemental.js:446-461 correctly identifies that high-hardness tap water (>150 ppm Ca) plus CalMag causes Mg lockout from Ca excess. The default advice should mention testing base water first.

## Missing Caveats

- **Defoliation threshold missing light context**: stage-content.js:112 says "Last heavy defoliation (<20% of fan leaves)" but the 20% threshold is only safe at moderate PPFD. At low PPFD (<400) even 20% is too much. The task-engine correctly adds a 600 PPFD caveat for day-21 defol (task-engine.js:355-357), but stage-content.js does not.

- **Ripening stage VPD targets too aggressive**: grow-knowledge.js:73-78 targets RH 30-40% day in ripening. This is extremely dry and risks desiccating trichome heads faster than necessary. Practical range is 40-50% in ripening, matching the stage-content recommendation of 45-50%.

## Bro-Science Properly Debunked

- Flushing correctly debunked: stage-rules.js:105-106, stage-content.js:275, knowledge-articles.js:518-520, knowledge-science.js:101-113. Consistent Stemeroff 2017 citation. Well done.
- 48h darkness correctly flagged: stage-content.js:311. Ice water correctly flagged: stage-content.js:312.
- CO2 below 800 PPFD correctly called waste: knowledge-articles.js:87-88, stage-content.js:94.
