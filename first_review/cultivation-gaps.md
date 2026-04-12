# Cultivation Knowledge Gaps

Summary: The knowledge base covers the core grow cycle well but has meaningful gaps in IPM depth, medium-specific nuance, and post-harvest precision.

## VPD Targets

VPD ranges are sound but the science supplement (knowledge-science.js:8) correctly notes no cannabis-specific VPD dose-response study exists. The targets are physiological extrapolations. The leaf-temp correction under LED (subtract 2-3C from air temp) is mentioned in science but NOT wired into VPD calculator logic or task-engine warnings.

## DLI Recommendations

DLI_TARGETS in grow-knowledge.js are well-structured with yield/quality/terpene splits. Missing: DLI calculation for the 13h photoperiod documented in knowledge-articles.js:556-558 (Ahrens 2024). The DLI formula uses hours but no article or tool recalculates targets for 13/11 schedules.

## Nutrient Lockout

No visual lockout chart is present. The pH-lockout text (knowledge-articles.js:129) mentions specific ranges but the codebase lacks a structured data table mapping pH ranges to specific nutrient lockouts (e.g., Fe locks above 6.5, Ca/Mg lock below 5.5). This data exists in prose but not in queryable form for the plant doctor.

## IPM Depth

IPM coverage is limited to spider mites, fungus gnats, and botrytis. Missing entirely: thrips, broad mites, russet mites (only in supplemental edge cases), aphids, whiteflies, powdery mildew treatment protocols (only prevention mentioned). No biological control dosing rates for predatory mites (how many per sqm).

## Watering by Medium/Pot-Size

WATERING_FREQUENCY in grow-knowledge.js covers soil/coco/hydro/soilless across three pot sizes. Missing: fabric pot vs plastic pot differential (fabric dries 30-50% faster, acknowledged in knowledge-articles.js:476 but not reflected in frequency data). The supplemental edge case fabric-pot-3gal (edge-case-knowledge-supplemental.js:36) catches the extreme case but the general watering table does not adjust for container type.

## Training Timing Windows

Topping window (day 14 of early-veg, stage-rules.js:50) is reasonable. Missing: explicit LST start/stop windows per stage, supercropping cutoff relative to stem lignification (mentioned in prose at stage-content.js:164 but no data structure).

## Harvest Timing Precision

Trichome-based harvest advice exists but the amber percentage recommendations are inconsistent across files (see contradictions file). Missing: strain-class-specific trichome targets. The high-CBD adjustment (strain-class-adjustments.js:399) says "60-70% cloudy, 10% amber max" which is good, but no equivalent exists for sativa-dominant (which should harvest earlier cloudy for cerebral effect).

## Drying/Curing Science

The 62% jar RH target is well-documented. Missing: weight-loss curve benchmarks (stage-content.js:353 mentions daily weight but no target percentages per day), stem diameter calibration for snap test, and grove bag/turkey bag alternatives to mason jars.

## Autoflower Flower Stage Durations

getStageDurations() in stage-rules.js:261-265 sets early-veg: 12, late-veg: 10, transition: 0 for autos, but leaves flower stages at photoperiod defaults. The strain-database has totalDays for autos but no code maps totalDays to flower stage durations. Auto flower stages use the same 18/18/18 day split as photoperiods, which is wrong.
