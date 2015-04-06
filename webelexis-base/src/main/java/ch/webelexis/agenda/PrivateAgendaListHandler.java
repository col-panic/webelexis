package ch.webelexis.agenda;

import static ch.webelexis.Cleaner.ELEXISDATE;
import static ch.webelexis.Cleaner.NAME;
import static ch.webelexis.Cleaner.WORD;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.Iterator;
import java.util.List;
import java.util.TreeSet;

import org.vertx.java.core.Handler;
import org.vertx.java.core.eventbus.EventBus;
import org.vertx.java.core.eventbus.Message;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.json.impl.Json;
import org.vertx.java.core.logging.Logger;

import ch.webelexis.Cleaner;

public class PrivateAgendaListHandler implements Handler<Message<JsonObject>> {
	static final int FLD_DAY = 0;
	static final int FLD_BEGIN = 1;
	static final int FLD_DURATION = 2;
	static final int FLD_RESOURCE = 3;
	static final int FLD_TYPE = 4;
	static final int FLD_TERMIN_ID = 5;
	EventBus eb;
	JsonObject cfg;
	Logger log = Server.log;

	public PrivateAgendaListHandler(EventBus eb, JsonObject cfg) {
		this.eb = eb;
		this.cfg = cfg;
	}

	@Override
	public void handle(Message<JsonObject> externalRequest) {
		/**
		 * This is, what an authorized user gets. Due to an ill-designed database
		 * layout, a single join does not return all appointments, since the "PatID"
		 * field is dual use: either it's a patient id (which would be covered by
		 * the join in the first place) or it is just a manually entered description
		 * or a name for the appointment (and such appointments are lost with the
		 * join) Therefore we must make 2 database calls. One for the joint and one
		 * for all appointments of the given date. (Oh, there would be an SQL join
		 * to cover that case with a single call indeed, but -the heck- this does
		 * not work with the mysql-jdbc-driver.)
		 * 
		 * The original implementation of elexis does this even worse: It makes a
		 * separate database call for every single entry. This would be very
		 * inefficient over slow internet connections.
		 * 
		 * @param event
		 * @param request
		 */
		// first call: get all Appointments with valid PatientID
		log.info("authorized agenda handler");
		final Cleaner cl = new Cleaner(externalRequest);
		JsonObject bridge = new JsonObject()
				.putString("action", "prepared")
				.putString(
						"statement",
						"SELECT A.Tag,A.Beginn,A.Dauer, A.Bereich, A.TerminTyp, A.ID, A.PatID,A.TerminStatus,A.Grund,K.Bezeichnung1,K.Bezeichnung2, K.geburtsdatum from AGNTERMINE as A, KONTAKT as K where K.id=A.PatID and A.Tag>=? and A.Tag <=? and A.Bereich=? and A.deleted='0'")
				.putArray(
						"values",
						new JsonArray(new String[] { cl.get("begin", ELEXISDATE), cl.get("end", ELEXISDATE),
								cl.get("resource", NAME) }));
		System.out.println(bridge.toString());
		eb.send("ch.webelexis.sql", bridge, new firstLevel(externalRequest));
	}

	class firstLevel implements Handler<Message<JsonObject>> {
		Message<JsonObject> externalRequest;

		firstLevel(Message<JsonObject> externalRequest) {
			this.externalRequest = externalRequest;
		}

		@Override
		public void handle(Message<JsonObject> sqlResult1) {
			Cleaner cl = new Cleaner(sqlResult1);
			if (cl.get("status", WORD).equals("ok")) {

				final JsonArray appts = cl.getArray("results", new JsonArray());
				log.debug("first level okay with " + appts.size() + " results");

				cl=new Cleaner(externalRequest);
				JsonObject bridge = new JsonObject()
						.putString("action", "prepared")
						.putString(
								"statement",
								"SELECT Tag,Beginn,Dauer,Bereich, TerminTyp, ID, PatID, TerminStatus, Grund from AGNTERMINE where Tag>=? and Tag <=? and Bereich=? and deleted='0'")
						.putArray(
								"values",
								new JsonArray(new String[] { cl.get("begin", ELEXISDATE), cl.get("end", ELEXISDATE),
										cl.get("resource", NAME) }));
				log.info(bridge.encodePrettily());
				eb.send("ch.webelexis.sql", bridge, new secondLevel(externalRequest, appts));

			} else {
				log.info("first level failed " + sqlResult1.body().getString("message"));
				System.out.println(Json.encodePrettily(sqlResult1.body()));
				externalRequest.reply(new JsonObject().putString("status", "failure"));
			}

		}

	}

	class secondLevel implements Handler<Message<JsonObject>> {
		Message<JsonObject> externalRequest;
		JsonArray appts;

		secondLevel(Message<JsonObject> externalRequest, JsonArray appts) {
			this.externalRequest = externalRequest;
			this.appts = appts;
		}

		@Override
		public void handle(Message<JsonObject> second) {
			if (second.body().getString("status").equals("ok")) {
				Server.log.debug("second level okay");
				JsonObject ores = fillBlanks(appts, second.body().getArray("results"));
				ores.putString("type", "full");
				externalRequest.reply(ores);
			} else {
				Server.log.error("second level failed");
				System.out.println(Json.encodePrettily(second.body()));
				externalRequest.reply(new JsonObject().putString("status", "failure").putString("reason",
						second.body().getString("status")));
			}
		}

		private JsonObject fillBlanks(JsonArray a1, JsonArray a2) {
			TreeSet<JsonArray> orderedList = new TreeSet<JsonArray>(new Comparator<JsonArray>() {
				@Override
				public int compare(JsonArray o1, JsonArray o2) {
					String id1 = o1.get(FLD_TERMIN_ID);
					String id2 = o2.get(FLD_TERMIN_ID);
					if (id1.equals(id2)) {
						return 0;
					} else {
						String day1 = o1.get(FLD_DAY);
						String day2 = o2.get(FLD_DAY);
						if (day1.equals(day2)) {
							int start1 = Integer.parseInt(((String) o1.get(FLD_BEGIN)).trim());
							int start2 = Integer.parseInt(((String) o2.get(FLD_BEGIN)).trim());
							return start1 - start2;
						}

						return day1.compareTo(day2);
					}
				}
			});

			@SuppressWarnings("rawtypes")
			Iterator it=a1.iterator();
			while(it.hasNext()){
				Object o=it.next();
				JsonArray line = (JsonArray) o;
				// line.set(FLD_TYPE, "occupied");
				orderedList.add(line);
			}
			it=a2.iterator();
			while(it.hasNext()){
				JsonArray line = (JsonArray) it.next();
				// line.set(FLD_TYPE, "occupied");
				orderedList.add(line);
			}

			int endTime = 0;
			Iterator<JsonArray> lines = orderedList.iterator();
			JsonArray arr = new JsonArray();

			// Fill in "available" spaces between appointments. Avalailables have
			// the length "slot" as defined in the config
			while (lines.hasNext()) {
				JsonArray aNext = (JsonArray) lines.next();
				int startTime = Integer.parseInt(((String) aNext.get(FLD_BEGIN)).trim());
				while ((startTime - endTime) > 0) {
					String[] free = new String[aNext.size()];
					free[FLD_DAY] = aNext.get(FLD_DAY);
					free[FLD_BEGIN] = Integer.toString(endTime);
					free[FLD_DURATION] = Integer.toString(startTime - endTime);
					free[FLD_RESOURCE] = aNext.get(FLD_RESOURCE);
					free[FLD_TYPE] = "available";
					arr.addArray(new JsonArray(free));
					endTime += (startTime - endTime);
					// System.out.println("created "+free[FLD_BEGIN]+","+free[FLD_DURATION]);
				}
				if ((startTime - endTime) > 0) {
					String[] free = new String[aNext.size()];
					free[FLD_DAY] = aNext.get(FLD_DAY);
					free[FLD_BEGIN] = Integer.toString(endTime);
					free[FLD_DURATION] = Integer.toString(startTime - endTime);
					free[FLD_RESOURCE] = aNext.get(FLD_RESOURCE);
					free[FLD_TYPE] = "occupied";
					// System.out.println("rest "+free[FLD_BEGIN]+","+free[FLD_DURATION]);
					arr.addArray(new JsonArray(free));
				}
				endTime = startTime + Integer.parseInt(((String) aNext.get(FLD_DURATION)).trim());
				arr.addArray(aNext);
			}

			JsonObject ores = new JsonObject().putString("status", "ok").putString("type", "full")
					.putArray("appointments", arr);
			return ores;

		}

	}

}