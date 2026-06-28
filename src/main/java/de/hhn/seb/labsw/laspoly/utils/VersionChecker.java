/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.utils;

import de.hhn.seb.labsw.laspoly.utils.StorageUtils;

public final class VersionChecker {
    public static final double VERSION = 0.65;

    private VersionChecker() {
    }

    public static void run() {
        double storedVersion = StorageUtils.readStoredVersion();
        if (!Double.isNaN(storedVersion) && storedVersion != VERSION) {
            StorageUtils.deleteSettings();
        }
        StorageUtils.writeStoredVersion(VERSION);
    }
}
