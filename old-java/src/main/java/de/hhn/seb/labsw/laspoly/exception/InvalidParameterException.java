/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.exception;

public class InvalidParameterException
extends RuntimeException {
    public InvalidParameterException(String cond, String parameterName, Object value) {
        super("An invalid parameter was given. The following condition was hurt: " + cond + " // Parameter the hurt condition: " + parameterName + " (Value: " + String.valueOf(value) + ")");
    }
}

