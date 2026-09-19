"""Synthetic Emergency Incidents Dataset Generator.

Generates realistic emergency call logs, citizen reports, and sensor alerts
with text descriptions, incident types, severities, priority levels, and coordinates.
"""

import csv
import json
import random
from pathlib import Path

random.seed(42)

DATA_DIR = Path(__file__).parent

# Templates for emergency incidents across categories and severities
TEMPLATES = [
    # FIRE
    {
        "type": "fire",
        "severity": "critical",
        "priority": 1,
        "texts": [
            "Massive explosion at chemical factory! Multiple workers trapped inside and flames spreading to adjacent units.",
            "Four-story residential building fully engulfed in flames. Screaming heard from upper floors, multiple casualties reported.",
            "Severe fire outbreak in downtown commercial complex, heavy black smoke, structural collapse imminent.",
            "Industrial gas pipeline rupture with huge fireball and multiple injured workers trapped in plant area.",
            "Major warehouse fire with toxic fumes released, nearby school needing immediate evacuation.",
        ],
    },
    {
        "type": "fire",
        "severity": "high",
        "priority": 2,
        "texts": [
            "Apartment fire on third floor, flames visible from balcony. Residents evacuating, 2 people suffering from smoke inhalation.",
            "Wildfire spreading rapidly towards residential suburb due to high winds. Urgent containment needed.",
            "Restaurant kitchen fire spreading to roof ventilation. Staff evacuated, fire brigade requested urgently.",
            "Vehicle pileup caught fire on national highway, two cars burning with people trapped.",
            "Electrical substation transformer caught fire, loud buzzing and thick smoke in residential area.",
        ],
    },
    {
        "type": "fire",
        "severity": "medium",
        "priority": 3,
        "texts": [
            "Small dumpster fire in alleyway behind supermarket. No structures currently threatened.",
            "Dry grass fire in vacant plot near railway track, smoke blowing towards road.",
            "Car engine caught fire on roadside shoulder, driver is out safely, no injuries.",
            "Small smoke coming from air conditioning unit on second floor office.",
            "Rubbish pile burning near vacant construction site, smoke bothering nearby residents.",
        ],
    },
    {
        "type": "fire",
        "severity": "low",
        "priority": 4,
        "texts": [
            "Controlled agricultural burn producing slight smoke in rural boundary.",
            "Unattended small bonfire in public park, no immediate danger.",
            "Extinguished kitchen pan fire, caller requesting precautionary smoke inspection.",
            "Smoldering campfire remains found in picnic clearing.",
        ],
    },
    # FLOOD
    {
        "type": "flood",
        "severity": "critical",
        "priority": 1,
        "texts": [
            "River embankment breach! Flash flood submerging entire low-lying village, over 50 families stranded on rooftops.",
            "Reservoir dam overflow causing rapid surge, bridge washed away, several vehicles swept away with passengers.",
            "Catastrophic urban flash flooding, basement parking submerged with people trapped inside elevator.",
            "Severe storm surge breaking seawall, water rushing into coastal hospital ground floor.",
        ],
    },
    {
        "type": "flood",
        "severity": "high",
        "priority": 2,
        "texts": [
            "Heavy rain causing storm canal to overflow, water entering ground floor houses in Sector 4.",
            "Underpass completely flooded with 5 feet of water, two cars stuck with passengers waiting on roof.",
            "River water level rising above danger mark, low-lying slums being evacuated.",
            "Main drainage choked, waist-deep water flooding commercial district streets.",
        ],
    },
    {
        "type": "flood",
        "severity": "medium",
        "priority": 3,
        "texts": [
            "Waterlogging on main avenue causing 2-hour traffic gridlock, water reaching knee height.",
            "Storm drain overflowing onto pedestrian sidewalk and parking lot.",
            "Basement of apartment complex experiencing water ingress, pumps required.",
            "Road flooded after heavy downpour, passenger vehicles having difficulty crossing.",
        ],
    },
    {
        "type": "flood",
        "severity": "low",
        "priority": 4,
        "texts": [
            "Puddle accumulation on residential street curb, slow drainage.",
            "Minor gutter seepage in lane 5, no property damage.",
            "Surface water pooling near park entrance following light drizzle.",
        ],
    },
    # INDUSTRIAL ACCIDENT
    {
        "type": "industrial_accident",
        "severity": "critical",
        "priority": 1,
        "texts": [
            "Ammonia gas leak detected at cold storage facility, 15 workers unconscious and mass casualty alert sounded.",
            "Boiler blast at manufacturing unit, roof collapsed with multiple workers buried under debris.",
            "Toxic chemical spill of chlorine gas, corrosive cloud spreading towards residential colony.",
            "Radiation warning alarm triggered in testing lab, immediate hazmat response required.",
        ],
    },
    {
        "type": "industrial_accident",
        "severity": "high",
        "priority": 2,
        "texts": [
            "Crane collapse at major construction site, operator injured and high-voltage power lines snapped.",
            "Corrosive acid tank valve leak in industrial zone, perimeter cordoned off.",
            "Conveyor belt failure in steel mill causing molten metal spill, three workers suffered burns.",
            "Worker fell from 30ft scaffolding onto metal beams, severe trauma, rescue team needed.",
        ],
    },
    {
        "type": "industrial_accident",
        "severity": "medium",
        "priority": 3,
        "texts": [
            "Machine malfunction at textile plant, one worker hand injury, first aid dispatched.",
            "Small oil spill in warehouse loading dock, slip hazard, containment kits deployed.",
            "Electrical spark panel tripping repeatedly with burning plastic odor in factory unit B.",
            "Forklift collided with storage shelving, non-hazardous goods spilled across aisle.",
        ],
    },
    {
        "type": "industrial_accident",
        "severity": "low",
        "priority": 4,
        "texts": [
            "Precautionary fire alarm triggered in server room due to dust buildup.",
            "Minor coolant drip from CNC machine, maintenance team handling.",
            "Safety inspection protocol test run at logistics depot.",
        ],
    },
    # ROAD ACCIDENT
    {
        "type": "road_accident",
        "severity": "critical",
        "priority": 1,
        "texts": [
            "Mass casualty collision: intercity bus overturned on highway ravine, over 30 passengers severely injured and trapped.",
            "Multi-vehicle pileup involving oil tanker and 8 passenger cars, tanker leaking flammable fuel with fire hazard.",
            "Head-on collision between passenger bus and truck, multiple fatalities and people pinned inside wreckage.",
        ],
    },
    {
        "type": "road_accident",
        "severity": "high",
        "priority": 2,
        "texts": [
            "High-speed SUV rollover crash on expressway, 3 passengers unconscious and trapped inside vehicle.",
            "School van collision with pickup truck, 4 children injured, immediate medical dispatch requested.",
            "Pedestrian struck by speeding vehicle at pedestrian crossing, severe head injuries.",
            "Motorcyclist struck by delivery truck, lying unresponsive on arterial ring road.",
        ],
    },
    {
        "type": "road_accident",
        "severity": "medium",
        "priority": 3,
        "texts": [
            "Two-car collision at intersection, airbags deployed, drivers have minor cuts and shock.",
            "Fender bender between taxi and city bus blocking two lanes of traffic, no serious injuries.",
            "Auto-rickshaw tipped on sharp turn, passenger has minor arm abrasion.",
            "Delivery van rear-ended stationary car at red light, minor bumper damage and neck pain reported.",
        ],
    },
    {
        "type": "road_accident",
        "severity": "low",
        "priority": 4,
        "texts": [
            "Minor scratch collision in shopping mall parking lot, drivers arguing over insurance.",
            "Stationary vehicle tire puncture on highway shoulder, hazard lights on.",
            "Rear mirror collision in slow-moving traffic jam, no injuries.",
        ],
    },
    # MEDICAL
    {
        "type": "medical",
        "severity": "critical",
        "priority": 1,
        "texts": [
            "Cardiac arrest in public transit station, 55-year-old male unresponsive, bystander CPR in progress.",
            "Severe anaphylactic shock at restaurant, patient experiencing respiratory failure and swelling.",
            "Child drowning incident in municipal swimming pool, unconscious, not breathing, AED required immediately.",
            "Multiple people collapsed at outdoor concert due to suspected heat stroke and dehydration crisis.",
        ],
    },
    {
        "type": "medical",
        "severity": "high",
        "priority": 2,
        "texts": [
            "Elderly woman showing stroke symptoms: facial droop, slurred speech, acute weakness on right side.",
            "Severe asthma attack in residential home, inhaler ineffective, oxygen saturation dropping rapidly.",
            "Fall from height in residence, 40-year-old with suspected spinal trauma and compound fracture.",
            "Diabetic emergency, patient unresponsive with extremely low blood sugar reading.",
        ],
    },
    {
        "type": "medical",
        "severity": "medium",
        "priority": 3,
        "texts": [
            "Adult with high fever, vomiting, and suspected acute dehydration requesting ambulance transport.",
            "Deep kitchen laceration on hand bleeding steadily, direct pressure applied, stitches required.",
            "Sprained ankle and contusions after slipping on wet steps, patient unable to bear weight.",
            "Moderate allergic reaction with hives and facial itching after bee sting, breathing normal.",
        ],
    },
    {
        "type": "medical",
        "severity": "low",
        "priority": 4,
        "texts": [
            "Caller feeling mild dizziness after missing lunch, asking for non-emergency medical advice.",
            "Routine non-emergency patient transport requested for scheduled dialysis appointment.",
            "Minor nosebleed that has subsided, caller asking for precautionary check.",
        ],
    },
    # OTHER
    {
        "type": "other",
        "severity": "high",
        "priority": 2,
        "texts": [
            "Suspicious unattended duffel bag with exposed wiring near subway entrance ticket counter.",
            "Active gas smell in dense residential neighborhood, multiple residents reporting nausea.",
            "Large ancient oak tree fallen across busy roadway, crushing power lines and parked vehicle.",
        ],
    },
    {
        "type": "other",
        "severity": "medium",
        "priority": 3,
        "texts": [
            "Water main pipe burst flooding intersection and disrupting local drinking water supply.",
            "Traffic signal outage at four-way intersection causing chaotic vehicular gridlock.",
            "Large stray animal trapped in drainage culvert, animal rescue assistance requested.",
        ],
    },
    {
        "type": "other",
        "severity": "low",
        "priority": 4,
        "texts": [
            "Noise complaint regarding loud late-night construction work.",
            "Streetlight pole flickering in alleyway behind library.",
            "Lost personal belongings reported near central bus terminal.",
        ],
    },
]

# Variations and modifiers to expand the dataset to ~500 items
MODIFIERS = [
    ("Urgent: ", " Dispatch immediately."),
    ("Caller reports: ", " Please send backup."),
    ("Sensor alert: ", " Automatic threshold exceeded."),
    ("Citizen emergency report: ", " Situation escalating."),
    ("Field team update: ", " Responders on scene request assistance."),
    ("911 Call log: ", " Caller very distressed."),
    ("", " Perimeter needs to be secured."),
    ("", " Emergency personnel dispatched."),
    ("", ""),
]

BASE_LAT = 12.9716  # Bangalore coordinates as default disaster response grid
BASE_LON = 77.5946


def generate_dataset(target_count: int = 500) -> list[dict]:
    dataset = []
    id_counter = 1

    # First add all base templates
    for item in TEMPLATES:
        for text in item["texts"]:
            lat = round(BASE_LAT + random.uniform(-0.15, 0.15), 6)
            lon = round(BASE_LON + random.uniform(-0.15, 0.15), 6)
            dataset.append({
                "id": id_counter,
                "incident_type": item["type"],
                "severity": item["severity"],
                "priority": item["priority"],
                "description": text,
                "latitude": lat,
                "longitude": lon,
            })
            id_counter += 1

    # Expand with augmented modifier variations
    while len(dataset) < target_count:
        item = random.choice(TEMPLATES)
        base_text = random.choice(item["texts"])
        prefix, suffix = random.choice(MODIFIERS)
        description = f"{prefix}{base_text}{suffix}".strip()

        lat = round(BASE_LAT + random.uniform(-0.20, 0.20), 6)
        lon = round(BASE_LON + random.uniform(-0.20, 0.20), 6)

        dataset.append({
            "id": id_counter,
            "incident_type": item["type"],
            "severity": item["severity"],
            "priority": item["priority"],
            "description": description,
            "latitude": lat,
            "longitude": lon,
        })
        id_counter += 1

    return dataset


def main():
    data = generate_dataset(500)
    json_path = DATA_DIR / "emergency_incidents.json"
    csv_path = DATA_DIR / "emergency_incidents.csv"

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f, fieldnames=["id", "incident_type", "severity", "priority", "description", "latitude", "longitude"]
        )
        writer.writeheader()
        writer.writerows(data)

    print(f"Successfully generated {len(data)} emergency incidents in:")
    print(f"  - {json_path}")
    print(f"  - {csv_path}")


if __name__ == "__main__":
    main()

