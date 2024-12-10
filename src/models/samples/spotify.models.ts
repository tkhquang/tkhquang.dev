const CURRENT_PLAYING_SAMPLE_RESPONSE = {
  actions: {
    interrupting_playback: false,
    pausing: false,
    resuming: false,
    seeking: false,
    skipping_next: false,
    skipping_prev: false,
    toggling_repeat_context: false,
    toggling_repeat_track: false,
    toggling_shuffle: false,
    transferring_playback: false,
  },
  context: {
    external_urls: {
      spotify: "string",
    },
    href: "string",
    type: "string",
    uri: "string",
  },
  currently_playing_type: "string",
  device: {
    id: "string",
    is_active: false,
    is_private_session: false,
    is_restricted: false,
    name: "Kitchen speaker",
    supports_volume: false,
    type: "computer",
    volume_percent: 59,
  },
  is_playing: false,
  item: {
    album: {
      album_type: "compilation",
      artists: [
        {
          external_urls: {
            spotify: "string",
          },
          href: "string",
          id: "string",
          name: "string",
          type: "artist",
          uri: "string",
        },
      ],
      available_markets: ["CA", "BR", "IT"],
      external_urls: {
        spotify: "string",
      },
      href: "string",
      id: "2up3OPMp9Tb4dAKM2erWXQ",
      images: [
        {
          height: 300,
          url: "https://i.scdn.co/image/ab67616d00001e02ff9ca10b55ce82ae553c8228",
          width: 300,
        },
      ],
      name: "string",
      release_date: "1981-12",
      release_date_precision: "year",
      restrictions: {
        reason: "market",
      },
      total_tracks: 9,
      type: "album",
      uri: "spotify:album:2up3OPMp9Tb4dAKM2erWXQ",
    },
    artists: [
      {
        external_urls: {
          spotify: "string",
        },
        href: "string",
        id: "string",
        name: "string",
        type: "artist",
        uri: "string",
      },
    ],
    available_markets: ["string"],
    disc_number: 0,
    duration_ms: 0,
    explicit: false,
    external_ids: {
      ean: "string",
      isrc: "string",
      upc: "string",
    },
    external_urls: {
      spotify: "string",
    },
    href: "string",
    id: "string",
    is_local: false,
    is_playable: false,
    linked_from: {},
    name: "string",
    popularity: 0,
    preview_url: "string",
    restrictions: {
      reason: "string",
    },
    track_number: 0,
    type: "track",
    uri: "string",
  },
  progress_ms: 0,
  repeat_state: "string",
  shuffle_state: false,
  timestamp: 0,
};

export type CurrentPlayingResponse = typeof CURRENT_PLAYING_SAMPLE_RESPONSE;
