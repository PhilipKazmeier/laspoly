package de.hhn.labsw.laspoly.utils;

import java.io.File;
import java.io.InputStream;
import java.util.logging.LogManager;
import java.util.logging.Logger;

/**
 * Util class used for getting Data from the drive.
 */
public class IOUtils {

    /**
     * Private constructor that prevents instantiation.
     */
    private IOUtils(){}

    /**
     * Creates a logger with the logging.properties at the directory.
     *
     * @param c         Class that is requesting the logger.
     * @param directory Directory for the logging.properties.
     * @return Created {@link java.util.logging.Logger}.
     */
    public static Logger initializeLogger(Class c, String directory) {
        final File logsDirectory = new File("logs");
        if (!logsDirectory.exists()) {
            logsDirectory.mkdir();
        }
        Logger logger = Logger.getLogger(c.getName());
        final InputStream inputStream = c.getClassLoader()
                .getResourceAsStream(directory);
        try {
            LogManager.getLogManager().readConfiguration(inputStream);
            logger.info("Logger was initialized.");
        } catch (Exception e) {
            Logger.getAnonymousLogger().severe("Could not load default logging.properties");
            Logger.getAnonymousLogger().severe(e.getMessage());
        }
        return logger;
    }
}
