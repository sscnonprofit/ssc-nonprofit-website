import {
  blankEvent,
  monthKey,
  occurrences,
  notesFor,
  type CalendarDocument,
  type CalendarEvent,
  type Series,
  type Category,
} from "./model";

export function novemberSeed(): CalendarDocument {
  const w = "willow",
    h = "healthcare",
    both = [w, h];
  const doc: CalendarDocument = {
    calendars: [
      {
        id: w,
        name: "Willow Lane Activity Calendar",
        subtitle: "Activities",
        color: "wine",
        theme: "classic",
        font: "sans",
        visibility: "public",
        locationIds: [
          "tol",
          "cafe",
          "lr",
          "dr",
          "gallery",
          "entrance",
          "hall",
          "outing",
        ],
        footer: "Willow Lane Activity Calendar, activities subject to change",
        editorIds: [],
        archived: false,
        order: 0,
        showNotes: true,
        holidays: true,
        printMode: "month",
      },
      {
        id: h,
        name: "Healthcare Calendar",
        subtitle: "Hickory – Maple – Oak",
        color: "gold",
        theme: "minimal",
        font: "sans",
        visibility: "public",
        locationIds: [
          "tol",
          "cafe",
          "willow",
          "oak",
          "gallery",
          "entrance",
          "hall",
        ],
        footer:
          "This calendar is subject to change. Changes will be posted throughout facility.",
        editorIds: [],
        archived: false,
        order: 1,
        showNotes: true,
        holidays: true,
        printMode: "month",
      },
    ],
    locations: [
      ["tol", "Tree Of Life", "TOL"],
      ["cafe", "Café", "Café"],
      ["lr", "Willow Lane Living Room", "LR"],
      ["dr", "Willow Lane Dining Room", "DR"],
      ["gallery", "Art Gallery", "Gallery"],
      ["willow", "Willow Neighborhood", "Willow"],
      ["oak", "Oak Neighborhood", "Oak"],
      ["entrance", "Main Entrance", "Main Entrance"],
      ["hall", "Front Hall", "Front Hall"],
      ["fair", "Gallery, TOL and Main Hallway", "Gallery / TOL / Hall"],
      ["outing", "Community Outing", "Outing"],
    ].map(([id, name, code]) => ({
      id,
      name,
      code,
      note: "",
    })),
    events: [],
    series: [],
    notes: [],
    months: {},
    sourceNotes: [
      "Transcribed from the two supplied November 2026 calendars. Please review against the originals before redistributing.",
      "TOL stands for Tree Of Life, as confirmed by staff.",
      "Willow Lane November 18 lunch destination is transcribed as Raineri’s Four of a Kind; confirm spelling.",
      "Healthcare November 25 says ‘Afternoon: Deck the Halls with Kohler Students’ without a precise time; retained as an untimed entry.",
      "Healthcare November 1 displays a faint template overlay; dates follow the actual November 2026 Sunday-first calendar.",
    ],
  };
  for (const c of doc.calendars) {
    c.locationIds.push("fair");
    doc.months[monthKey(c.id, "2026-11")] = {
      generated: true,
      status: "draft",
      headerImage: "",
      snapshot: [],
      notes: [],
    };
  }
  let index = 0;
  function event(
    ids: string[],
    days: number[],
    time: string,
    title: string,
    locationId = "",
    category: Category = "Games",
    extra: Partial<CalendarEvent> = {},
  ) {
    for (const day of days)
      doc.events.push({
        ...blankEvent(`2026-11-${String(day).padStart(2, "0")}`, ids[0]),
        id: `nov-event-${++index}`,
        calendarIds: ids,
        time,
        allDay: !time,
        title,
        locationId,
        category,
        featured: true,
        ...extra,
      });
  }
  function weekly(
    ids: string[],
    weekday: number,
    time: string,
    title: string,
    locationId = "",
    category: Category = "Games",
    extra: Partial<Series> = {},
  ) {
    const s: Series = {
      ...blankEvent("2026-11-01", ids[0]),
      id: `nov-series-${++index}`,
      calendarIds: ids,
      time,
      allDay: !time,
      title,
      locationId,
      category,
      rule: "weekly",
      interval: 1,
      weekdays: [weekday],
      nth: 1,
      until: "",
      dates: [],
      exceptions: {},
      ...extra,
    };
    doc.series.push(s);
    return s;
  }
  weekly(both, 0, "08:00", "Lutheran Hour", "", "Faith");
  weekly([h], 0, "08:30", "Voice of Immanuel", "", "Faith");
  weekly(both, 0, "09:00", "Church of the Air", "", "Faith", {
    detail: "WHBL – 1330 radio",
  });
  weekly(both, 0, "09:00", "Catholic Mass", "", "Faith", {
    detail: "TV channel 23.3",
  });
  for (const [weekday, host] of [
    [1, "Sally"],
    [2, "Sally"],
    [3, "Sally"],
    [4, "Kathy"],
    [5, "Jane"],
  ] as const) {
    const s = weekly([w], weekday, "10:00", "Exercise", "lr", "Exercise", {
      host,
    });
    if (weekday === 2)
      s.exceptions["2026-11-03"] = {
        cancelled: true,
        title: "No Exercise",
        time: "",
        host: "",
        locationId: "",
        featured: true,
        allDay: true,
      };
    if (weekday === 4)
      s.exceptions["2026-11-26"] = {
        cancelled: true,
        title: "",
        calendarIds: [],
      };
    if (weekday === 5) s.exceptions["2026-11-27"] = { host: "" };
  }
  weekly([w], 1, "10:30", "Trivia", "lr");
  const uno = weekly([w], 1, "18:00", "Uno", "lr");
  uno.exceptions["2026-11-02"] = { time: "16:00" };
  event([w], [2], "14:00", "Nickel Bingo", "lr", "Games", {
    featured: false,
    notes: "Bring your nickels",
  });
  event(both, [2], "14:00", "Craft with Tammy!", "cafe", "Craft");
  event(
    both,
    [2],
    "18:00",
    "Healing Paws Therapy Dog Visit",
    "tol",
    "Visitor",
    { overrides: { [w]: { locationId: "lr" } } },
  );
  event(both, [9], "14:00", "Bill Bernico Music", "tol", "Music", {
    notes: "Music requests",
  });
  event(both, [16], "14:00", "Food Demo with Anne", "cafe", "Visitor");
  event(both, [23], "14:00", "Lil Rev Music", "tol", "Music", {
    notes: "harmonica, guitar, ukulele, folk",
  });
  event(
    both,
    [30],
    "14:00",
    "Make a Meal Donation: Pizza Casserole",
    "cafe",
    "Craft",
    { notes: "Willow Lane: Make a meal for warming center" },
  );
  event([h], [9, 23], "10:00", "Crossword Puzzles", "tol", "Games", {
    featured: false,
  });
  weekly([w], 2, "14:00", "Bingo", "dr");
  weekly(both, 2, "15:15", "Sheepshead", "cafe");
  event(both, [3], "18:30", "Gary Cross Music & Happy Hour", "tol", "Music", {
    notes: "Country & Patriotic",
  });
  event(both, [10], "18:30", "Music with Dionne", "tol", "Music", {
    notes: "piano & guitar",
  });
  event(both, [17], "18:30", "Trent Macht Music & Happy Hour", "tol", "Music", {
    notes: "easy listening",
  });
  event(both, [24], "18:00", "Movie: La Bamba", "tol", "Movie", {
    detail: "La Bamba",
  });
  event([w], [10], "10:30", "Poetry Pit Stop", "lr", "Craft", {
    featured: false,
    notes: "read and share poetry",
  });
  event([w], [17], "10:30", "Name That Tune", "lr", "Music", {
    featured: false,
  });
  event([w], [24], "10:30", "Shopping Trip", "outing", "Outing", {
    featured: false,
    detail: "Meijer",
  });
  event(
    [h],
    [10],
    "10:30",
    "Healthcare Resident Council Meeting",
    "tol",
    "Meeting",
  );
  weekly(both, 3, "10:00", "Rosary", "tol", "Faith");
  weekly(both, 3, "10:30", "Catholic Mass", "tol", "Faith");
  weekly(both, 3, "10:30", "Skip Bo", "lr", "Games", {
    overrides: { [h]: { locationId: "willow" } },
  });
  weekly([w], 3, "18:00", "Sheepshead", "lr");
  event(
    both,
    [4],
    "14:00",
    "Games with Lisa from the Bookmobile",
    "tol",
    "Visitor",
  );
  event(
    both,
    [11],
    "14:00",
    "Wall of Honor Ribbon Cutting & Veterans Day Gathering",
    "entrance",
    "Visitor",
  );
  event([w], [18], "11:30", "Out to Lunch", "outing", "Outing", {
    featured: false,
    detail: "Raineri’s Four of a Kind",
  });
  event(both, [18], "14:00", "Paint & Sip", "gallery", "Craft");
  event([w], [25], "13:30", "Resident Council", "lr", "Meeting", {
    featured: false,
  });
  event([h], [25], "", "Deck the Halls with Kohler Students", "", "Visitor", {
    notes: "Afternoon — time to be confirmed",
    featured: false,
  });
  event([w], [25], "19:00", "Packers vs LA Rams", "", "Sports", {
    detail: "Packers vs LA Rams",
  });
  const service = weekly(
    both,
    4,
    "10:15",
    "Protestant Service",
    "tol",
    "Faith",
    {
      host: "Pastor Johnson",
      exceptions: {
        "2026-11-12": {
          title: "Protestant Service & Communion",
          host: "Pastor McKnight",
        },
        "2026-11-19": { title: "Trinity Lutheran Service", host: "" },
        "2026-11-26": { calendarIds: [], cancelled: true, title: "" },
      },
    },
  );
  void service;
  for (const [time, title, loc] of [
    ["10:30", "Dominoes", "lr"],
    ["14:00", "Bingo", "dr"],
  ])
    weekly([w], 4, time, title, loc, "Games", {
      exceptions: {
        "2026-11-26": { calendarIds: [], cancelled: true, title: "" },
      },
    });
  weekly(both, 4, "15:15", "Sheepshead", "cafe", "Games", {
    exceptions: {
      "2026-11-26": { calendarIds: [], cancelled: true, title: "" },
    },
  });
  event([h], [5], "18:30", "Relaxation Exercise", "tol", "Exercise", {
    featured: false,
  });
  event([h], [12], "14:00", "Coffee & Conversation", "oak", "Visitor", {
    featured: false,
  });
  event(both, [12], "18:30", "Music Trivia", "tol", "Music", {
    featured: false,
  });
  event(both, [19], "18:30", "Room to Room Hand Massages", "", "Visitor", {
    featured: false,
    endTime: "19:30",
    host: "Teresa",
    signUp: true,
    contact: "Melissa",
    notes: "Sign up with Melissa",
  });
  event([h], [19], "14:00", "Trivia", "tol", "Games", { featured: false });
  event([h], [26], "", "Happy Thanksgiving!", "", "Visitor", { banner: true });
  for (const [time, title] of [
    ["12:00", "Bears at Lions"],
    ["15:30", "Eagles at Cowboys"],
    ["19:20", "Chiefs at Bills"],
  ])
    event([w], [26], time, title, "", "Sports", { detail: title });
  event([w], [26], "14:00", "UNO", "cafe", "Games", { featured: false });
  weekly(both, 5, "10:30", "Wii Bowling", "tol");
  event(
    both,
    [6],
    "13:30",
    "Frances Rank Piano Polkas & Waltzes",
    "tol",
    "Music",
  );
  event(
    both,
    [6],
    "14:00",
    "Drop-in Craft with North High Students",
    "cafe",
    "Craft",
    {
      endTime: "15:00",
      overrides: { [w]: { time: "14:30" } },
      featured: false,
    },
  );
  event(
    both,
    [13],
    "14:00",
    "Rick Gustafson Instrumental Music",
    "tol",
    "Music",
  );
  event(both, [20], "14:00", "Kings in the Corner", "cafe", "Games", {
    featured: false,
  });
  event([w], [20], "14:00", "Nickel Bingo", "lr", "Games", {
    featured: false,
    notes: "Bring your nickels",
  });
  event([w], [20], "18:00", "Drive-in Movie", "gallery", "Movie");
  event([w], [27], "14:00", "Broncos at Steelers", "", "Sports");
  event(both, [27], "14:00", "UNO", "cafe", "Games", { featured: false });
  event(both, [7], "09:00", "SSC Craft Fair", "fair", "Craft", {
    endTime: "14:00",
    notes: "Invite your family!",
  });
  event(both, [14], "10:00", "Stained Glass Art Project", "cafe", "Craft");
  event(
    both,
    [21],
    "10:30",
    "Tap Dance Performance with Sue Alby",
    "gallery",
    "Visitor",
  );
  event([h], [28], "14:00", "Trivia", "tol", "Games", { featured: false });
  for (const [day, movie] of [
    [7, "Akeelah and the Bee"],
    [14, "Get Smart"],
    [21, "I Can Only Imagine"],
    [28, "Men in Black"],
  ] as const)
    event([w], [day], "13:30", "Movie", "lr", "Movie", { detail: movie });
  event([w], [8, 15, 22], "14:00", "Bingo", "dr");
  event([w], [8], "15:25", "Packers vs New England", "", "Sports");
  event([w], [15], "12:00", "Packers vs Minnesota", "", "Sports");
  event(
    both,
    [15, 22],
    "15:15",
    "Richard’s School of Dance Resident Class",
    "gallery",
    "Exercise",
  );
  doc.notes.push(
    {
      id: "dst",
      date: "2026-11-01",
      calendarIds: [w],
      text: "Daylight Saving Time Ends",
      banner: false,
    },
    {
      id: "bookmobile",
      date: "2026-11-04",
      calendarIds: both,
      text: "Bookmobile Day",
      banner: false,
    },
  );
  for (const day of [7, 14, 21, 28])
    for (const id of both)
      doc.notes.push({
        id: `weekend-${id}-${day}`,
        date: `2026-11-${String(day).padStart(2, "0")}`,
        calendarIds: [id],
        text: `Ask for a weekend activity packet${day === 14 ? " with scavenger hunt" : ""}.`,
        banner: false,
      });
  const all = occurrences(doc, "2026-11");
  for (const c of doc.calendars)
    doc.months[monthKey(c.id, "2026-11")] = {
      generated: true,
      status: "published",
      headerImage: "",
      snapshot: all.filter((e) => e.calendarIds.includes(c.id)),
      notes: notesFor(doc, c, "2026-11"),
    };
  return doc;
}
