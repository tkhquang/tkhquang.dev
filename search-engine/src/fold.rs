//! Latin accent normalization with Unicode lowercase fallback.
//! A zero table byte delegates to expansion or lowercase conversion.

/// U+00C0..=U+00FF, one ASCII byte per code point.
const LATIN1: &[u8; 64] =
    b"aaaaaa\0ceeeeiiii\0nooooo\0\0uuuuy\0\0aaaaaa\0ceeeeiiii\0nooooo\0\0uuuuy\0y";

/// U+0100..=U+017F.
const LATIN_EXTENDED_A: &[u8; 128] = b"aaaaaaccccccccdd\0\0eeeeeeeeeegggggggghhhhiiiiiiiiii\0\0jjkkkllllllllllnnnnnnnnnoooooo\0\0rrrrrrsssssssstttttt\
uuuuuuuuuuuuwwyyyzzzzzzs";

/// U+1EA0..=U+1EF9, the Vietnamese vowels with tone marks.
const LATIN_EXTENDED_ADDITIONAL: &[u8; 90] =
    b"aaaaaaaaaaaaaaaaaaaaaaaaeeeeeeeeeeeeeeeeiiiioooooooooooooooooooooooo\
uuuuuuuuuuuuuuyyyyyyyy";

/// Multi-letter expansions cannot fit in a single table byte.
fn expand(character: char) -> Option<&'static str> {
    Some(match character {
        'Æ' | 'æ' => "ae",
        'Œ' | 'œ' => "oe",
        'ß' => "ss",
        'Þ' | 'þ' => "th",
        'Ĳ' | 'ĳ' => "ij",
        _ => return None,
    })
}

/// Combining Diacritical Marks belong to the preceding Latin letter.
pub fn is_mark(character: char) -> bool {
    matches!(character as u32, 0x0300..=0x036F)
}

/// Appends normalized text and omits combining marks after their base letters.
pub fn fold_char(character: char, out: &mut String) {
    if character.is_ascii() {
        if character.is_ascii_alphanumeric() {
            out.push(character.to_ascii_lowercase());
        } else {
            out.push(character);
        }
        return;
    }

    if let Some(letters) = expand(character) {
        out.push_str(letters);
        return;
    }

    if is_mark(character) {
        return;
    }

    let point = character as u32;

    let folded = match point {
        0x00C0..=0x00FF => LATIN1[(point - 0x00C0) as usize],
        0x0100..=0x017F => LATIN_EXTENDED_A[(point - 0x0100) as usize],
        0x1EA0..=0x1EF9 => LATIN_EXTENDED_ADDITIONAL[(point - 0x1EA0) as usize],
        _ => 0,
    };

    if folded != 0 {
        out.push(folded as char);
        return;
    }

    for lowered in character.to_lowercase() {
        out.push(lowered);
    }
}
