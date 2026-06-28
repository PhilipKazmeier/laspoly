/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.utils;

import java.io.File;
import java.io.InputStream;
import java.util.logging.LogManager;
import java.util.logging.Logger;

public final class LoggerFactory {
    public static final String LOG_FOLDER = System.getProperty("user.home") + "/.laspoly/logs";

    private LoggerFactory() {
    }

    public static Logger initializeLogger(Class c, String directory) {
        File logsDirectory = new File(LOG_FOLDER);
        if (!logsDirectory.exists()) {
            logsDirectory.mkdirs();
        }
        Logger logger = Logger.getLogger(c.getName());
        InputStream inputStream = c.getClassLoader().getResourceAsStream(directory);
        try {
            LogManager.getLogManager().readConfiguration(inputStream);
            logger.info("Logger was initialized for " + c.getName());
        }
        catch (Exception e) {
            Logger.getAnonymousLogger().severe("Could not load default logging.properties: " + e.getMessage());
        }
        return logger;
    }
}

