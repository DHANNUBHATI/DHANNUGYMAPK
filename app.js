// Dhannu Bhati Gym - minimal Expo app (App.js)
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@workout_log_v1';

const SAMPLE_LIBRARY = [
  { id: 'bench', name: 'Bench Press', media: 'https://i.imgur.com/3KfKX.gif' },
  { id: 'squat', name: 'Back Squat', media: 'https://i.imgur.com/8Kq3Y.gif' },
  { id: 'deadlift', name: 'Deadlift', media: 'https://i.imgur.com/0Z6Yx.gif' },
  { id: 'ohp', name: 'Overhead Press', media: 'https://i.imgur.com/9b1Gq.gif' },
  { id: 'row', name: 'Barbell Row', media: 'https://i.imgur.com/tA6mU.gif' }
];

export default function App() {
  const [log, setLog] = useState([]); // persistent via AsyncStorage
  const [selectedExercise, setSelectedExercise] = useState(SAMPLE_LIBRARY[0]);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setLog(JSON.parse(raw));
      } catch (e) { console.warn(e); }
    })();
  }, []);

  const saveLog = async (newLog) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newLog));
      setLog(newLog);
    } catch (e) { console.warn(e); }
  };

  const addSet = () => {
    if (!weight || !reps) return Alert.alert('Enter weight and reps');
    const entryDate = new Date().toISOString();
    const setItem = { weight: Number(weight), reps: Number(reps), time: entryDate };
    const lastIndex = log.findIndex(l => l.exerciseId === selectedExercise.id && l.date.split('T')[0] === entryDate.split('T')[0]);
    let newLog = [...log];
    if (lastIndex >= 0) {
      newLog[lastIndex].sets.push(setItem);
      newLog[lastIndex].date = entryDate;
    } else {
      newLog.unshift({ date: entryDate, exerciseId: selectedExercise.id, exerciseName: selectedExercise.name, media: selectedExercise.media, sets: [setItem] });
    }
    saveLog(newLog);
    setWeight('');
    setReps('');
  };

  const suggestNextWeight = (exerciseId) => {
    for (let entry of log) {
      if (entry.exerciseId === exerciseId && entry.sets && entry.sets.length) {
        const lastWeight = entry.sets[entry.sets.length - 1].weight;
        const add = Math.max(2.5, Math.round(lastWeight * 0.05 * 10) / 10);
        return Math.round((lastWeight + add) * 10) / 10;
      }
    }
    return null;
  };

  const exportJSON = () => {
    const payload = JSON.stringify(log, null, 2);
    Alert.alert('Export JSON (first 1000 chars)', payload.substring(0,1000));
  };

  const clearAll = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setLog([]);
  };

  const getLast = () => log.length ? log[0] : null;

  return (
    <ScrollView style={{ flex:1, padding:18, backgroundColor:'#fff' }}>
      <Text style={{ fontSize:28, fontWeight:'700', marginBottom:8 }}>Dhannu Bhati Gym</Text>

      <Text style={{ fontSize:16, marginVertical:6 }}>Choose exercise</Text>
      <FlatList horizontal data={SAMPLE_LIBRARY} keyExtractor={i=>i.id} renderItem={({item})=>(
        <TouchableOpacity onPress={()=>setSelectedExercise(item)} style={{ marginRight:10, alignItems:'center' }}>
          <Image source={{uri:item.media}} style={{width:84,height:84,borderRadius:8,borderWidth:selectedExercise.id===item.id?2:0,borderColor:'#000'}} />
          <Text style={{ width:84, textAlign:'center' }}>{item.name}</Text>
        </TouchableOpacity>
      )} style={{ marginBottom:12 }} />

      <Text style={{ fontSize:16, marginBottom:6 }}>{selectedExercise.name}</Text>
      <Image source={{uri:selectedExercise.media}} style={{ width:'100%', height:180, borderRadius:8, marginBottom:8 }} />

      <View style={{ flexDirection:'row', gap:8, marginBottom:12 }}>
        <TextInput placeholder='Weight (kg)' value={weight} onChangeText={setWeight} keyboardType='numeric' style={{ flex:1, borderWidth:1, padding:10, borderRadius:6 }} />
        <TextInput placeholder='Reps' value={reps} onChangeText={setReps} keyboardType='numeric' style={{ width:90, borderWidth:1, padding:10, borderRadius:6 }} />
      </View>

      <TouchableOpacity onPress={addSet} style={{ backgroundColor:'#000', padding:12, borderRadius:8, marginBottom:12 }}>
        <Text style={{ color:'#fff', textAlign:'center', fontWeight:'600' }}>Add Set</Text>
      </TouchableOpacity>

      <View style={{ marginBottom:10 }}>
        <Text style={{ fontSize:16, fontWeight:'600' }}>Suggestion</Text>
        <Text>{(() => { const s = suggestNextWeight(selectedExercise.id); return s? Try ~ ${s} kg next time : 'No history yet' })()}</Text>
      </View>

      <View style={{ marginVertical:8 }}>
        <Text style={{ fontSize:18, fontWeight:'700' }}>Last Entries</Text>
        {getLast() ? (
          <View style={{ padding:10, borderWidth:1, borderRadius:8, marginTop:8 }}>
            <Text style={{ fontWeight:'700' }}>{getLast().exerciseName}</Text>
            <Text style={{ color:'#555' }}>{new Date(getLast().date).toLocaleString()}</Text>
            {getLast().sets.map((s,idx)=>(
              <Text key={idx}>Set {idx+1}: {s.weight} kg x {s.reps}</Text>
            ))}
          </View>
        ) : <Text style={{ color:'#666' }}>No entries yet</Text>}
      </View>

      <View style={{ marginVertical:12 }}>
        <Text style={{ fontSize:18, fontWeight:'700' }}>History</Text>
        {log.length===0 && <Text style={{ color:'#666' }}>No history</Text>}
        <FlatList data={log} keyExtractor={i=>i.date + i.exerciseId} renderItem={({item})=>(
          <View style={{ padding:10, borderWidth:1, marginVertical:6, borderRadius:8 }}>
            <Text style={{ fontWeight:'700' }}>{item.exerciseName}</Text>
            <Text style={{ color:'#666' }}>{new Date(item.date).toLocaleString()}</Text>
            {item.sets.map((s,idx)=><Text key={idx}>Set {idx+1}: {s.weight} kg x {s.reps}</Text>)}
          </View>
        )} />
      </View>

      <View style={{ marginBottom:40 }}>
        <TouchableOpacity onPress={exportJSON} style={{ padding:12, borderRadius:8, borderWidth:1, marginBottom:8 }}>
          <Text style={{ textAlign:'center' }}>Export JSON</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={clearAll} style={{ padding:12, borderRadius:8, borderWidth:1 }}>
          <Text style={{ textAlign:'center' }}>Clear all data</Text>
        </TouchableOpacity>
      </View>

      <Text style={{ fontSize:12, color:'#666', marginBottom:30 }}>Tip: This app saves data locally on device.</Text>
    </ScrollView>
  );
}
