/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.utils;

import com.google.gson.JsonDeserializationContext;
import com.google.gson.JsonDeserializer;
import com.google.gson.JsonElement;
import com.google.gson.JsonPrimitive;
import com.google.gson.JsonSerializationContext;
import com.google.gson.JsonSerializer;
import java.lang.reflect.Type;
import org.joda.time.DateTime;
import org.joda.time.format.DateTimeFormatter;
import org.joda.time.format.ISODateTimeFormat;

public class DateTimeConverter
implements JsonSerializer<DateTime>,
JsonDeserializer<DateTime> {
    @Override
    public DateTime deserialize(JsonElement json, Type typeOfT, JsonDeserializationContext context) {
        DateTimeFormatter fmt = ISODateTimeFormat.dateTime();
        return fmt.parseDateTime(json.getAsString());
    }

    @Override
    public JsonElement serialize(DateTime src, Type typeOfSrc, JsonSerializationContext context) {
        DateTimeFormatter fmt = ISODateTimeFormat.dateTime();
        return new JsonPrimitive(fmt.print(src));
    }
}

