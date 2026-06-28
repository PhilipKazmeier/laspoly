/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.application.Platform
 */
package de.hhn.seb.labsw.laspoly.utils;

import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import javafx.application.Platform;

public final class ThreadRunner {
    private static ExecutorService service = Executors.newFixedThreadPool(Runtime.getRuntime().availableProcessors());

    private ThreadRunner() {
    }

    public static void run(Runnable runnable) {
        service.execute(runnable);
    }

    public static void run(final Runnable runnable, long delay) {
        final Timer timer = new Timer();
        timer.schedule(new TimerTask(){

            @Override
            public void run() {
                service.execute(runnable);
                timer.cancel();
            }
        }, delay);
    }

    public static void onFX(final Runnable runnable, long delay) {
        final Timer timer = new Timer();
        timer.schedule(new TimerTask(){

            @Override
            public void run() {
                Platform.runLater((Runnable)runnable);
                timer.cancel();
            }
        }, delay);
    }

    public static void stop() {
        service.shutdown();
    }
}

